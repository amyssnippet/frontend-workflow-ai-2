const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const axios = require('axios');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { Flowchart, FlowchartVersion, User, RequestLog } = require('../models');

// Configuration
const OLLAMA_API_URL = "https://linking-digest-see-archive.trycloudflare.com/api/chat";
const OLLAMA_MODEL = "granite3.3:8b";
const TOKEN = "ac01d6d03fe9feac354add11a4ac67ef51a089594835d56056436f48c9e00ed1";

// Ensure directories exist
const ensureDirectories = () => {
    const dirs = ['static', 'uploads', 'temp'];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

ensureDirectories();

// File upload configuration
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'text/plain'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file type'), false);
        }
    }
});

// Check if mmdc is installed
const checkMmdcInstalled = async () => {
    try {
        const mmdc_path = process.platform === 'win32' 
            ? 'C:\\Users\\amoly\\AppData\\Roaming\\npm\\mmdc.cmd'
            : '/usr/bin/mmdc';
        
        await execAsync(`${mmdc_path} --version`);
        return true;
    } catch (error) {
        console.error('Mermaid CLI (mmdc) not found:', error.message);
        return false;
    }
};

// Sanitize Mermaid code
const sanitizeMermaidCode = (mermaidCode) => {
    // Remove code block markers
    mermaidCode = mermaidCode.replace(/```mermaid/&gm,'');
    mermaidCode = mermaidCode.replace(/```$/gm, '');

    const lines = mermaidCode.split('\n');
    const cleaned = [];
    let hasGraph = false;
    let nodeCounter = 0;

    for (const line of lines) {
        const stripped = line.trim();
        if (!stripped) continue;

        // Check for graph declaration
        if (stripped.startsWith('graph ')) {
            hasGraph = true;
            if (!stripped.endsWith(';')) {
                cleaned.push(stripped + ';');
            } else {
                cleaned.push(stripped);
            }
            continue;
        }

        // Check for edges
        if (stripped.includes('-->') || stripped.includes('-.->') || stripped.includes('---')) {
            let safeLine = stripped.replace(/"/g, "'");
            safeLine = safeLine.replace(/{/g, '[').replace(/}/g, ']');
            cleaned.push(safeLine);
            continue;
        }

        // Check for node definitions
        const nodeMatch = stripped.match(/^(\w+)\[(.*)\]$/);
        if (nodeMatch) {
            const [, nodeId, label] = nodeMatch;
            let safeLabel = label.replace(/"/g, "'");
            safeLabel = safeLabel.replace(/[^\w\s\-\.,()']/, '');
            safeLabel = safeLabel.replace(/\s+/g, ' ').trim();
            cleaned.push(`${nodeId}[${safeLabel}]`);
            continue;
        }

        // Default handling for other lines
        nodeCounter++;
        let safeLabel = stripped.replace(/"/g, "'");
        safeLabel = safeLabel.replace(/[^\w\s\-\.,()']/, '');
        safeLabel = safeLabel.replace(/\s+/g, ' ').trim();
        cleaned.push(`N${nodeCounter}[${safeLabel}]`);
    }

    if (!hasGraph) {
        cleaned.unshift('graph TD;');
    }

    return cleaned.join('\n') + '\n';
};

// Call Ollama API
const callOllamaGranite = async (userPrompt) => {
    const systemMessageContent = `You are ONLY to output a valid Mermaid flowchart code block.
The output MUST be ONLY the Mermaid code block, enclosed in triple backticks with 'mermaid'.
Rules to follow strictly:
1. The diagram MUST start with 'graph TD;' or 'graph LR;'.
2. Node text inside [] or {} MUST NOT contain parentheses (), commas, colons, semicolons, or special symbols. Use simple words only.
3. If multiple options are needed, represent them as separate nodes or as edge labels, not inside a single node.
4. Only output nodes and edges — no explanations, no comments.
If input cannot be converted, output a minimal valid diagram:
\`\`\`mermaid
graph TD; A[Invalid Input];
\`\`\``;

    const messages = [
        { role: "control", content: "thinking" },
        { role: "system", content: systemMessageContent },
        { role: "user", content: userPrompt }
    ];

    const payload = {
        model: OLLAMA_MODEL,
        messages: messages,
        stream: false
    };

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
    };

    try {
        const response = await axios.post(OLLAMA_API_URL, payload, { headers });
        const generatedContent = response.data.message?.content?.trim() || '';

        const mermaidMatch = generatedContent.match(/``````/s);
        if (mermaidMatch) {
            return mermaidMatch[1].trim();
        } else {
            return 'graph TD;\nA[No valid Mermaid diagram generated];';
        }
    } catch (error) {
        console.error('Error calling Ollama:', error.message);
        return 'graph TD;\nA[Error generating diagram];';
    }
};

// Repair Mermaid code using Ollama
const repairMermaidWithOllama = async (brokenCode) => {
    const prompt = `The following Mermaid code is invalid. Please fix and return ONLY valid Mermaid code:\n\n\`\`\`mermaid\n${brokenCode}\n\`\`\``;
    return await callOllamaGranite(prompt);
};

// Convert Mermaid to image
const translateMermaidToImage = async (mermaidCode, outputFilename, outputFormat = 'png') => {
    if (!(await checkMmdcInstalled())) {
        return { success: false, error: 'Mermaid CLI not found' };
    }

    const tempMermaidFile = path.join(__dirname, '../temp', 'temp.mmd');
    const outputPath = path.join(__dirname, '../static', `${outputFilename}.${outputFormat}`);

    try {
        // Write Mermaid code to temp file
        fs.writeFileSync(tempMermaidFile, mermaidCode);

        const mmdc_path = process.platform === 'win32'
            ? 'C:\\Users\\amoly\\AppData\\Roaming\\npm\\mmdc.cmd'
            : '/usr/bin/mmdc';

        await execAsync(`"${mmdc_path}" -i "${tempMermaidFile}" -o "${outputPath}"`);
        
        return { success: true, path: outputPath };
    } catch (error) {
        console.error('mmdc parse error:', error.message);
        return { success: false, error: `mmdc parse error: ${error.message}` };
    } finally {
        // Clean up temp file
        if (fs.existsSync(tempMermaidFile)) {
            fs.unlinkSync(tempMermaidFile);
        }
    }
};

// Extract text from uploaded file
const extractTextFromFile = async (filePath, mimetype) => {
    let text = '';
    
    try {
        switch (mimetype) {
            case 'application/pdf':
                const pdfBuffer = fs.readFileSync(filePath);
                const pdfData = await pdfParse(pdfBuffer);
                text = pdfData.text;
                break;
                
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            case 'application/msword':
                const docResult = await mammoth.extractRawText({ path: filePath });
                text = docResult.value;
                break;
                
            case 'text/plain':
                text = fs.readFileSync(filePath, 'utf-8');
                break;
                
            default:
                throw new Error('Unsupported file type');
        }
    } catch (error) {
        console.error('Failed to extract text:', error.message);
        return '';
    }
    
    return text.trim();
};

// Main generate diagram endpoint
const generateDiagram = async (req, res) => {
    const startTime = Date.now();
    let success = true;
    let errorMessage = null;
    
    try {
        const { description, output_format = 'png' } = req.body;
        let promptText = description?.trim() || null;

        // Handle file upload if present
        if (req.file) {
            const extractedText = await extractTextFromFile(req.file.path, req.file.mimetype);
            if (!extractedText) {
                return res.status(422).json({ error: 'File is empty or unsupported' });
            }
            promptText = extractedText;
            
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
        }

        if (!promptText) {
            return res.status(400).json({ error: 'No input provided' });
        }

        // Step 1: Generate Mermaid code
        let mermaidCode = await callOllamaGranite(promptText);
        mermaidCode = sanitizeMermaidCode(mermaidCode);

        // Step 2: Try rendering
        const filename = `generated_flowchart_${Date.now()}`;
        let renderResult = await translateMermaidToImage(mermaidCode, filename, output_format);

        // Step 3: If failed, try repair
        if (!renderResult.success) {
            console.log('First render failed. Attempting repair with Ollama...');
            const repairedCode = await repairMermaidWithOllama(mermaidCode);
            const sanitizedRepaired = sanitizeMermaidCode(repairedCode);
            renderResult = await translateMermaidToImage(sanitizedRepaired, filename, output_format);

            if (renderResult.success) {
                mermaidCode = sanitizedRepaired;
            } else {
                success = false;
                errorMessage = renderResult.error;
                mermaidCode = 'graph TD;\nA[Diagram generation failed after repair];';
            }
        }

        // Log the request
        const processingTime = Date.now() - startTime;
        if (req.user) {
            await RequestLog.create({
                UserId: req.user.id,
                ip: req.ip,
                model: OLLAMA_MODEL,
                prompt: promptText,
                response: mermaidCode,
                totalTokensUsed: Math.ceil(promptText.length / 4), // Rough estimate
                processingTime,
                success
            });
        }

        const imageUrl = `/static/${filename}.${output_format}`;
        
        res.json({
            mermaid: mermaidCode,
            image_url: imageUrl,
            success,
            error: errorMessage,
            processing_time: processingTime
        });

    } catch (error) {
        console.error('Generate diagram error:', error.message);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
};

// Save flowchart
const saveFlowchart = async (req, res) => {
    try {
        const { title, mermaidCode, description, tags, isPublic } = req.body;
        
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const flowchart = await Flowchart.create({
            title: title || 'Untitled Flowchart',
            mermaidCode,
            description,
            tags: tags || [],
            isPublic: isPublic || false,
            UserId: req.user.id
        });

        // Create initial version
        await FlowchartVersion.create({
            FlowchartId: flowchart.id,
            version: 1,
            mermaidCode,
            changeDescription: 'Initial version'
        });

        res.json({
            success: true,
            flowchart: {
                id: flowchart.id,
                title: flowchart.title,
                mermaidCode: flowchart.mermaidCode,
                description: flowchart.description,
                tags: flowchart.tags,
                isPublic: flowchart.isPublic,
                createdAt: flowchart.createdAt
            }
        });

    } catch (error) {
        console.error('Save flowchart error:', error.message);
        res.status(500).json({ 
            error: 'Failed to save flowchart',
            message: error.message 
        });
    }
};

// Get user's flowcharts
const getUserFlowcharts = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {
            UserId: req.user.id
        };

        if (search) {
            const { Op } = require('sequelize');
            whereClause.title = {
                [Op.iLike]: `%${search}%`
            };
        }

        const flowcharts = await Flowchart.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['updatedAt', 'DESC']],
            attributes: ['id', 'title', 'description', 'tags', 'isPublic', 'viewCount', 'createdAt', 'updatedAt']
        });

        res.json({
            success: true,
            flowcharts: flowcharts.rows,
            total: flowcharts.count,
            pages: Math.ceil(flowcharts.count / limit),
            currentPage: parseInt(page)
        });

    } catch (error) {
        console.error('Get user flowcharts error:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch flowcharts',
            message: error.message 
        });
    }
};

// Get flowchart by ID
const getFlowchartById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const flowchart = await Flowchart.findByPk(id, {
            include: [
                {
                    model: User,
                    attributes: ['id', 'fullName', 'email']
                },
                {
                    model: FlowchartVersion,
                    limit: 5,
                    order: [['version', 'DESC']]
                }
            ]
        });

        if (!flowchart) {
            return res.status(404).json({ error: 'Flowchart not found' });
        }

        // Check if user can access this flowchart
        if (!flowchart.isPublic && (!req.user || req.user.id !== flowchart.UserId)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Increment view count
        await flowchart.increment('viewCount');

        res.json({
            success: true,
            flowchart
        });

    } catch (error) {
        console.error('Get flowchart by ID error:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch flowchart',
            message: error.message 
        });
    }
};

module.exports = {
    generateDiagram,
    saveFlowchart,
    getUserFlowcharts,
    getFlowchartById,
    upload
};

const express = require('express');
const router = express.Router();
const { 
    generateDiagram, 
    saveFlowchart, 
    getUserFlowcharts, 
    getFlowchartById,
    upload 
} = require('../controllers/flowchartController');
const { authenticate } = require('../middleware');

// Generate diagram endpoint (public)
router.post('/generate', upload.single('file'), generateDiagram);

// Save flowchart (protected)
router.post('/save', authenticate, saveFlowchart);

// Get user's flowcharts (protected)
router.get('/my-flowcharts', authenticate, getUserFlowcharts);

// Get flowchart by ID (public for public flowcharts, protected for private)
router.get('/:id', getFlowchartById);

// Update flowchart (protected)
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, mermaidCode, description, tags, isPublic } = req.body;
        
        const flowchart = await Flowchart.findByPk(id);
        
        if (!flowchart) {
            return res.status(404).json({ error: 'Flowchart not found' });
        }
        
        if (flowchart.UserId !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        // Create new version if mermaid code changed
        if (mermaidCode && mermaidCode !== flowchart.mermaidCode) {
            const latestVersion = await FlowchartVersion.findOne({
                where: { FlowchartId: id },
                order: [['version', 'DESC']]
            });
            
            await FlowchartVersion.create({
                FlowchartId: id,
                version: (latestVersion?.version || 0) + 1,
                mermaidCode,
                changeDescription: req.body.changeDescription || 'Updated diagram'
            });
        }
        
        await flowchart.update({
            title: title || flowchart.title,
            mermaidCode: mermaidCode || flowchart.mermaidCode,
            description: description !== undefined ? description : flowchart.description,
            tags: tags || flowchart.tags,
            isPublic: isPublic !== undefined ? isPublic : flowchart.isPublic
        });
        
        res.json({
            success: true,
            flowchart
        });
        
    } catch (error) {
        console.error('Update flowchart error:', error.message);
        res.status(500).json({ 
            error: 'Failed to update flowchart',
            message: error.message 
        });
    }
});

// Delete flowchart (protected)
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        const flowchart = await Flowchart.findByPk(id);
        
        if (!flowchart) {
            return res.status(404).json({ error: 'Flowchart not found' });
        }
        
        if (flowchart.UserId !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        await flowchart.destroy();
        
        res.json({
            success: true,
            message: 'Flowchart deleted successfully'
        });
        
    } catch (error) {
        console.error('Delete flowchart error:', error.message);
        res.status(500).json({ 
            error: 'Failed to delete flowchart',
            message: error.message 
        });
    }
});

module.exports = router;

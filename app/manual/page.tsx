'use client';

import { useState, useEffect } from 'react';
import { Upload, FileText, Download, Loader2, Save, Plus, Trash2, Image as ImageIcon } from 'lucide-react';

interface WorkflowStep {
  number: number;
  title: string;
  description: string;
  filename: string;
  image_path: string;
  full_analysis: string;
}

interface ApiResponse {
  sop_docx_url: string;
  workflow_steps: WorkflowStep[];
  total_steps: number;
  input_images_count: number;
  message: string;
  all_success: boolean;
}

export default function WorkflowGenerator() {
  const [activeTab, setActiveTab] = useState<'input' | 'output'>('input');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [editedSteps, setEditedSteps] = useState<WorkflowStep[]>([]);
  const [saving, setSaving] = useState(false);
  const [docTitle, setDocTitle] = useState('Standard Operating Procedure');

  useEffect(() => {
    if (response?.workflow_steps) {
      setEditedSteps(JSON.parse(JSON.stringify(response.workflow_steps)));
    }
  }, [response]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one image');
      return;
    }

    setUploading(true);
    setError('');
    setResponse(null);

    try {
      const formData = new FormData();
      selectedFiles.forEach(file => formData.append('files', file));
      formData.append('output_format', 'png');

      const res = await fetch('https://flowai-backend.othersys.com/generate-process-images/', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data: ApiResponse = await res.json();
      setResponse(data);
      setActiveTab('output');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleStepEdit = (stepIndex: number, field: keyof WorkflowStep, value: string) => {
    setEditedSteps(prev => {
      const updated = [...prev];
      updated[stepIndex] = { ...updated[stepIndex], [field]: value };
      return updated;
    });
  };

  const handleAnalysisLineEdit = (stepIndex: number, lineIndex: number, newValue: string) => {
    setEditedSteps(prev => {
      const updated = [...prev];
      const lines = updated[stepIndex].full_analysis.split('\n');
      lines[lineIndex] = newValue;
      updated[stepIndex] = { ...updated[stepIndex], full_analysis: lines.join('\n') };
      return updated;
    });
  };

  const addAnalysisLine = (stepIndex: number) => {
    setEditedSteps(prev => {
      const updated = [...prev];
      const lines = updated[stepIndex].full_analysis.split('\n');
      const nextNumber = lines.length + 1;
      updated[stepIndex] = { 
        ...updated[stepIndex], 
        full_analysis: updated[stepIndex].full_analysis + `\n${nextNumber}. New step - Enter details here`
      };
      return updated;
    });
  };

  const removeAnalysisLine = (stepIndex: number, lineIndex: number) => {
    setEditedSteps(prev => {
      const updated = [...prev];
      const lines = updated[stepIndex].full_analysis.split('\n').filter((_, i) => i !== lineIndex);
      const renumbered = lines.map((line, i) => line.replace(/^\d+\.\s*/, `${i + 1}. `));
      updated[stepIndex] = { ...updated[stepIndex], full_analysis: renumbered.join('\n') };
      return updated;
    });
  };

  const regenerateDocx = async () => {
    setSaving(true);
    try {
      const res = await fetch('https://flowai-backend.othersys.com/regenerate-docx/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_steps: editedSteps }),
      });

      if (!res.ok) throw new Error('Failed to regenerate DOCX');

      const data = await res.json();
      if (response) {
        setResponse({ ...response, sop_docx_url: data.sop_docx_url });
      }
      alert('✓ Document saved successfully!');
    } catch (err) {
      alert('✗ Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const downloadDocx = () => {
    if (response?.sop_docx_url) {
      window.open(`https://flowai-backend.othersys.com${response.sop_docx_url}`, '_blank');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Navigation Bar */}
      <div className="flex-none bg-white border-b border-gray-300 shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Workflow SOP Generator</h1>
            <p className="text-xs text-gray-500">Create and edit professional documentation</p>
          </div>
          
          {/* Tab Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('input')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'input'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Input
            </button>
            <button
              onClick={() => setActiveTab('output')}
              disabled={!response}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'output' && response
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Edit Document
            </button>
          </div>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* INPUT TAB */}
        {activeTab === 'input' && (
          <div className="max-w-2xl mx-auto p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Upload Workflow Screenshots</h2>
              
              <label className="block">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700">Click to upload images</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG • Multiple files</p>
                </div>
                <input type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" />
              </label>

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">{selectedFiles.length} file(s) selected</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                            {index + 1}
                          </div>
                          <span className="text-sm text-gray-900">{file.name}</span>
                        </div>
                        <button onClick={() => removeFile(index)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={uploading || selectedFiles.length === 0}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                    Processing...
                  </>
                ) : (
                  'Generate Document'
                )}
              </button>

              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
            </div>
          </div>
        )}

        {/* OUTPUT TAB - DOCX Editor */}
        {activeTab === 'output' && response && (
          <div className="h-full bg-white">
            {/* Toolbar */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
              <div className="text-sm text-gray-600">
                {editedSteps.length} steps • Last saved: Just now
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={regenerateDocx}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm font-medium"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : <Save className="w-4 h-4 inline mr-2" />}
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={downloadDocx}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  Download
                </button>
              </div>
            </div>

            {/* Document Editor - Scrollable */}
            <div className="max-w-4xl mx-auto p-12 pb-24">
              {/* Document Title */}
              <div className="text-center mb-12">
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="text-3xl font-bold text-center text-gray-900 border-none focus:outline-none focus:ring-0 w-full"
                  placeholder="Document Title"
                />
                <p className="text-gray-500 mt-2">Step-by-Step Workflow Documentation</p>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Workflow Process</h2>
                <p className="text-gray-600 text-sm">Follow these steps in sequential order:</p>
              </div>

              {/* Editable Steps */}
              <div className="space-y-12">
                {editedSteps.map((step, stepIndex) => (
                  <div key={step.number} className="border-l-4 border-blue-600 pl-6">
                    {/* Step Number & Title */}
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="flex-none w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold">
                        {step.number}
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={step.description}
                          onChange={(e) => handleStepEdit(stepIndex, 'description', e.target.value)}
                          className="text-xl font-semibold text-gray-900 border-none focus:outline-none focus:ring-0 w-full p-0"
                          placeholder="Step description..."
                        />
                      </div>
                    </div>

                    {/* Image */}
                    {step.image_path && (
                      <div className="my-6 text-center">
                        <img
                          src={`https://flowai-backend.othersys.com/${step.image_path}`}
                          alt={`Step ${step.number}`}
                          className="max-w-full h-auto rounded-lg border border-gray-200 inline-block"
                          style={{ maxHeight: '400px' }}
                        />
                        <p className="text-sm text-gray-500 italic mt-2">Figure {step.number}: {step.filename}</p>
                      </div>
                    )}

                    {/* Process Summary */}
                    <h3 className="font-bold text-gray-800 mt-6 mb-3">Process Summary:</h3>

                    {/* Step-by-Step Instructions */}
                    <h3 className="font-bold text-gray-800 mt-4 mb-3">
                      {step.number === 1 ? 'Step-by-Step Instructions:' : 'Step-by-Step Instructions (Continued):'}
                    </h3>

                    {/* Editable Sub-steps */}
                    <div className="space-y-3 ml-4">
                      {step.full_analysis.split('\n').map((line, lineIndex) => {
                        const cleanLine = line.replace(/^\d+\.\s*/, '');
                        const parts = cleanLine.split(' - ');
                        const action = parts[0]?.trim() || '';
                        const details = parts[1]?.trim() || '';

                        return (
                          <div key={lineIndex} className="group">
                            {/* Sub-step heading */}
                            <div className="flex items-start space-x-2 mb-1">
                              <span className="font-bold text-gray-900 flex-none">Step {lineIndex + 1}:</span>
                              <input
                                type="text"
                                value={action}
                                onChange={(e) => {
                                  const newLine = details ? `${e.target.value} - ${details}` : e.target.value;
                                  handleAnalysisLineEdit(stepIndex, lineIndex, `${lineIndex + 1}. ${newLine}`);
                                }}
                                className="flex-1 text-gray-900 border-none focus:outline-none focus:ring-0 p-0 bg-transparent"
                                placeholder="Action..."
                              />
                              <button
                                onClick={() => removeAnalysisLine(stepIndex, lineIndex)}
                                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Bullet detail */}
                            {details && (
                              <div className="ml-6 flex items-start space-x-2">
                                <span className="flex-none text-gray-600">•</span>
                                <input
                                  type="text"
                                  value={`- ${details}`}
                                  onChange={(e) => {
                                    const newDetails = e.target.value.replace(/^-\s*/, '');
                                    const newLine = `${action} - ${newDetails}`;
                                    handleAnalysisLineEdit(stepIndex, lineIndex, `${lineIndex + 1}. ${newLine}`);
                                  }}
                                  className="flex-1 text-gray-700 border-none focus:outline-none focus:ring-0 p-0 bg-transparent"
                                  placeholder="Details..."
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Add Step Button */}
                      <button
                        onClick={() => addAnalysisLine(stepIndex)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1 mt-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add sub-step</span>
                      </button>
                    </div>

                    {/* Next Step Indicator */}
                    {step.number < editedSteps.length && (
                      <p className="mt-6 text-gray-700">
                        <span className="font-bold">→ Proceeds to:</span> Step {step.number + 1}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

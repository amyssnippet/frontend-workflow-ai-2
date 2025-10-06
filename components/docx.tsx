'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useState } from 'react';
import mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

export default function TiptapDocxEditor() {
  const [fileName, setFileName] = useState('');

  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Start typing or import a DOCX file...</p>',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg mx-auto focus:outline-none p-4',
      },
    },
  });

  const importDocx = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      editor?.commands.setContent(result.value);
      setFileName(file.name);
    } catch (error) {
      console.error('Error importing DOCX:', error);
      alert('Failed to import DOCX file');
    }
  };

  const exportToDocx = async () => {
    if (!editor) return;

    const content = editor.getJSON();
    const paragraphs: any[] = [];

    content.content?.forEach((node: any) => {
      if (node.type === 'paragraph') {
        const runs = node.content?.map((textNode: any) => {
          return new TextRun({
            text: textNode.text || '',
            bold: textNode.marks?.some((m: any) => m.type === 'bold'),
            italics: textNode.marks?.some((m: any) => m.type === 'italic'),
          });
        }) || [];
        paragraphs.push(new Paragraph({ children: runs }));
      } else if (node.type === 'heading') {
        const runs = node.content?.map((textNode: any) => {
          return new TextRun({
            text: textNode.text || '',
            bold: true,
            size: 28,
          });
        }) || [];
        paragraphs.push(new Paragraph({ 
          children: runs,
          heading: HeadingLevel[`HEADING_${node.attrs.level}` as keyof typeof HeadingLevel]
        }));
      }
    });

    const doc = new Document({
      sections: [{ children: paragraphs }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, fileName || 'document.docx');
  };

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="flex flex-col h-screen w-full">
      {/* Fixed Toolbar */}
      <div className="flex-shrink-0 border-b bg-white p-4 flex gap-2 flex-wrap shadow-sm">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-2 border rounded hover:bg-gray-100 ${
            editor.isActive('bold') ? 'bg-blue-500 text-white' : ''
          }`}
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-2 border rounded hover:bg-gray-100 ${
            editor.isActive('italic') ? 'bg-blue-500 text-white' : ''
          }`}
        >
          <em>I</em>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-3 py-2 border rounded hover:bg-gray-100 ${
            editor.isActive('heading', { level: 1 }) ? 'bg-blue-500 text-white' : ''
          }`}
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-3 py-2 border rounded hover:bg-gray-100 ${
            editor.isActive('heading', { level: 2 }) ? 'bg-blue-500 text-white' : ''
          }`}
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-2 border rounded hover:bg-gray-100 ${
            editor.isActive('bulletList') ? 'bg-blue-500 text-white' : ''
          }`}
        >
          • List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-2 border rounded hover:bg-gray-100 ${
            editor.isActive('orderedList') ? 'bg-blue-500 text-white' : ''
          }`}
        >
          1. List
        </button>

        <div className="ml-auto flex gap-2">
          <label className="px-3 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600">
            Import DOCX
            <input
              type="file"
              accept=".docx"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && importDocx(e.target.files[0])}
            />
          </label>
          <button
            onClick={exportToDocx}
            className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Export DOCX
          </button>
        </div>
      </div>

      {/* Scrollable Editor Container */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-4xl mx-auto bg-white shadow-lg my-8 min-h-[calc(100vh-200px)]">
          <div className="p-8">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
}

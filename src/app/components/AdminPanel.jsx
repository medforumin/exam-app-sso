import React, { useState, useEffect, useRef } from 'react';
import {
  Crown, Save, Plus, X, Search, ChevronLeft, ChevronRight, Megaphone, Sparkles,
  Layout, BookOpen, ChevronUp, ChevronDown, Trash2, Bold, Italic, Underline, Heading2,
  Heading3, Heading4, List, ListOrdered, Image as ImageIcon, Eraser, Code, Info, Eye,
  Globe, Laptop, Smartphone, Table, Type, Highlighter, ShieldCheck, CreditCard
} from 'lucide-react';
import { SafeHtmlContent } from './SafeHtmlContent';
import { useAppContext } from '../context/AppContext';
import { EXAM_TYPES, SESSIONS, PAPERS, YEARS } from '../config';
import { QuestionCard } from './QuestionCard';

function RichTextEditor({ value, onChange, placeholder = '' }) {
  const [isRaw, setIsRaw] = useState(false);
  const [textColor, setTextColor] = useState('#0d9488');
  const [bgColor, setBgColor] = useState('#fef08a');
  const editorRef = useRef(null);

  useEffect(() => {
    if (!isRaw && editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value, isRaw]);

  const exec = (command, commandValue = null) => {
    document.execCommand(command, false, commandValue);
    editorRef.current?.focus();
    handleInput();
  };

  const applyColor = (color, mode = 'foreColor') => {
    try { document.execCommand('styleWithCSS', false, true); } catch (e) { }
    document.execCommand(mode, false, color);
    editorRef.current?.focus();
    handleInput();
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const formatBlock = (tag) => {
    document.execCommand('formatBlock', false, tag);
    editorRef.current?.focus();
    handleInput();
  };

  const insertImageFromLink = () => {
    const url = window.prompt('Enter the image URL:', 'https://');
    if (url) exec('insertImage', url);
  };

  const insertTable = () => {
    const tableHtml = '<table border="1" style="width:100%; border-collapse:collapse; margin:10px 0;"><thead><tr><th style="border:1px solid #cbd5e1; padding:8px;">Header 1</th><th style="border:1px solid #cbd5e1; padding:8px;">Header 2</th></tr></thead><tbody><tr><td style="border:1px solid #cbd5e1; padding:8px;">Cell 1</td><td style="border:1px solid #cbd5e1; padding:8px;">Cell 2</td></tr></tbody></table><p><br></p>';
    exec('insertHTML', tableHtml);
  };

  const sanitizeHtml = (html) => {
    if (!html) return '';

    const cleaned = html
      .replace(/<!--[\s\S]*?-->/gi, '')
      .replace(/<o:p>[\s\S]*?<\/o:p>/gi, '')
      .replace(/<\/?(xml|w:[^>]+|mso:[^>]+|v:[^>]+|o:[^>]+)>/gi, '')
      .replace(/\sclass="[^"]*"/gi, '');

    const parser = new DOMParser();
    const doc = parser.parseFromString(cleaned, 'text/html');

    doc.querySelectorAll('meta, link, style, script, title').forEach(el => el.remove());

    // Convert <font color="..."> to <span style="color:...">
    doc.querySelectorAll('font').forEach(f => {
      const span = doc.createElement('span');
      const color = f.getAttribute('color') || (f.getAttribute('style') && (f.getAttribute('style').match(/color:\s*([^;]+)/i) || [])[1]);
      if (color) span.style.color = color;
      span.innerHTML = f.innerHTML;
      f.replaceWith(span);
    });

    const allowedTags = new Set([
      'p', 'div', 'span', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'br', 'a', 'img',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col', 'sub', 'sup', 'hr'
    ]);

    const allowedAttrs = new Set([
      'href', 'src', 'alt', 'title',
      'colspan', 'rowspan', 'border', 'cellpadding', 'cellspacing', 'width', 'height', 'align', 'valign', 'scope', 'style', 'target', 'rel'
    ]);

    doc.body.querySelectorAll('*').forEach(el => {
      const tag = el.tagName.toLowerCase();
      if (!allowedTags.has(tag)) {
        el.replaceWith(...Array.from(el.childNodes));
        return;
      }

      Array.from(el.attributes).forEach(attr => {
        if (!allowedAttrs.has(attr.name.toLowerCase())) el.removeAttribute(attr.name);
      });

      // Preserve safe styles (inline color, background-color, border, border-collapse, width, height, padding, text-align, etc.)
      const style = el.getAttribute('style');
      if (style) {
        try {
          const st = el.style;
          const safe = [];
          if (st.color) safe.push(`color:${st.color}`);
          if (st.backgroundColor) safe.push(`background-color:${st.backgroundColor}`);
          if (st.border) safe.push(`border:${st.border}`);
          if (st.borderCollapse) safe.push(`border-collapse:${st.borderCollapse}`);
          if (st.width) safe.push(`width:${st.width}`);
          if (st.height) safe.push(`height:${st.height}`);
          if (st.padding) safe.push(`padding:${st.padding}`);
          if (st.textAlign) safe.push(`text-align:${st.textAlign}`);
          if (st.verticalAlign) safe.push(`vertical-align:${st.verticalAlign}`);
          if (safe.length) el.setAttribute('style', safe.join(';'));
          else el.removeAttribute('style');
        } catch (e) {
          el.removeAttribute('style');
        }
      }

      el.removeAttribute('class');

      if (tag === 'div') {
        const hasBlockChildren = el.querySelector('p, div, table, ul, ol, h1, h2, h3, h4, h5, h6, blockquote, pre');
        if (!hasBlockChildren) {
          const p = document.createElement('p');
          p.innerHTML = el.innerHTML;
          el.replaceWith(p);
          return;
        }
      }

      if (tag === 'span' && !el.getAttribute('style') && !el.getAttribute('href') && !el.getAttribute('src') && !el.getAttribute('alt') && !el.getAttribute('title')) {
        const parent = el.parentNode;
        if (parent) {
          while (el.firstChild) parent.insertBefore(el.firstChild, el);
          parent.removeChild(el);
        }
      }
    });

    return doc.body.innerHTML
      .replace(/<p><br><\/p>/gi, '')
      .replace(/<div><br><\/div>/gi, '')
      .replace(/<p>\s*<\/p>/gi, '')
      .trim();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    let html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');

    if (!html) {
      document.execCommand('insertText', false, text);
      return;
    }

    const cleanHtml = sanitizeHtml(html);
    document.execCommand('insertHTML', false, cleanHtml || text);
  };

  const btnClass = 'p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/50';

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden flex flex-col bg-white dark:bg-gray-800 focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-transparent transition-all shadow-sm">
      <div className="bg-gray-50 dark:bg-gray-700/80 border-b border-gray-300 dark:border-gray-600 p-1.5 flex flex-wrap gap-1 items-center justify-between">
        <div className={`flex flex-wrap gap-1 items-center transition-opacity ${isRaw ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <button type="button" onClick={() => exec('bold')} className={btnClass} title="Bold"><Bold size={16} /></button>
          <button type="button" onClick={() => exec('italic')} className={btnClass} title="Italic"><Italic size={16} /></button>
          <button type="button" onClick={() => exec('underline')} className={btnClass} title="Underline"><Underline size={16} /></button>
          <div className="w-px h-5 bg-gray-300 dark:bg-gray-500 mx-1"></div>
          <button type="button" onClick={() => formatBlock('H2')} className={btnClass} title="Heading 2"><Heading2 size={16} /></button>
          <button type="button" onClick={() => formatBlock('H3')} className={btnClass} title="Heading 3"><Heading3 size={16} /></button>
          <button type="button" onClick={() => formatBlock('H4')} className={btnClass} title="Heading 4"><Heading4 size={16} /></button>
          <div className="w-px h-5 bg-gray-300 dark:bg-gray-500 mx-1"></div>
          <button type="button" onClick={() => exec('insertUnorderedList')} className={btnClass} title="Bullet List"><List size={16} /></button>
          <button type="button" onClick={() => exec('insertOrderedList')} className={btnClass} title="Numbered List"><ListOrdered size={16} /></button>
          <div className="w-px h-5 bg-gray-300 dark:bg-gray-500 mx-1"></div>
          <button type="button" onClick={insertTable} className={btnClass} title="Insert Table"><Table size={16} /></button>
          <button type="button" onClick={insertImageFromLink} className={btnClass} title="Insert Image Link"><ImageIcon size={16} /></button>
          <div className="w-px h-5 bg-gray-300 dark:bg-gray-500 mx-1"></div>
          <button type="button" onClick={() => exec('removeFormat')} className={btnClass} title="Clear Formatting"><Eraser size={16} /></button>
          <div className="w-px h-5 bg-gray-300 dark:bg-gray-500 mx-1"></div>

          {/* Text color picker button */}
          <div className="relative" title="Text color">
            <button
              type="button"
              className={`${btnClass} flex flex-col items-center justify-center relative h-8 w-8 !p-1`}
            >
              <Type size={14} />
              <span
                className="w-4 h-1 rounded-full mt-0.5 shadow-sm transition-colors border border-black/10 dark:border-white/10"
                style={{ backgroundColor: textColor }}
              />
            </button>
            <input
              type="color"
              value={textColor}
              onChange={(e) => {
                setTextColor(e.target.value);
                applyColor(e.target.value, 'foreColor');
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              title="Text color"
            />
          </div>

          {/* Highlight / background color button */}
          <div className="relative" title="Highlight color">
            <button
              type="button"
              className={`${btnClass} flex flex-col items-center justify-center relative h-8 w-8 !p-1`}
            >
              <Highlighter size={14} />
              <span
                className="w-4 h-1 rounded-full mt-0.5 shadow-sm transition-colors border border-black/10 dark:border-white/10"
                style={{ backgroundColor: bgColor }}
              />
            </button>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => {
                setBgColor(e.target.value);
                try { applyColor(e.target.value, 'hiliteColor'); } catch { applyColor(e.target.value, 'backColor'); }
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              title="Highlight color"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsRaw(!isRaw)}
          className={`px-2 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 ml-auto transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/50 ${isRaw ? 'bg-teal-600 text-white shadow-inner' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'}`}
        >
          <Code size={14} /> {isRaw ? 'Raw HTML' : 'Visual Editor'}
        </button>
      </div>

      <div className="relative flex-1 min-h-[220px] max-h-[520px] overflow-y-auto">
        {isRaw ? (
          <textarea
            className="w-full h-full min-h-[220px] p-4 font-mono text-sm bg-gray-900 text-green-400 outline-none resize-none leading-relaxed"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder || '<p>Enter raw HTML here...</p>'}
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onBlur={handleInput}
            onPaste={handlePaste}
            className="w-full h-full min-h-[220px] p-4 outline-none prose prose-sm prose-teal dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 cursor-text"
            style={{ minHeight: '220px' }}
            data-placeholder={placeholder}
          />
        )}

        {!isRaw && !value && (
          <div className="absolute top-4 left-4 text-gray-400 dark:text-gray-500 pointer-events-none select-none text-sm">
            {placeholder || 'Type the answer here...'}
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminPanel() {
  const {
    questions, uniqueTopics, addQuestion, updateQuestion, deleteQuestion,
    announcement, saveAnnouncement, teaserQuestionCount, saveTeaserCount,
    teaser, saveTeaserMessage, upgradeMsg, saveUpgradeMessage, curriculumMap, saveCurriculumMap, userRole,
    infoPopupContent, showInfoPopup, infoPopupTarget, saveInfoPopupSettings, setIsInfoModalOpen,
    ssoEnabled, saveSSOSettings, razorpayButtonId, saveRazorpayButtonId,
    enableInAppUpiUpgrade, upiId, payeeName, enableRazorpayButton, planRates, savePaymentSettings
  } = useAppContext();


  const [activeTab, setActiveTab] = useState('add');
  const [formData, setFormData] = useState({ questionText: '', answerText: '', mnemonic: '', topic: '', importance: 'Low', appearances: [] });
  const [targetCollection, setTargetCollection] = useState('questions');
  const [announcementText, setAnnouncementText] = useState(announcement || '');
  const [teaserText, setTeaserText] = useState(teaser || '');
  const [upgradeText, setUpgradeText] = useState(upgradeMsg || '');
  const [teaserQCountText, setTeaserQCountText] = useState(teaserQuestionCount || '500+');
  const [infoPopupText, setInfoPopupText] = useState(infoPopupContent || '');
  const [infoPopupEnabled, setInfoPopupEnabled] = useState(showInfoPopup ?? false);
  const [targetPlatform, setTargetPlatform] = useState(infoPopupTarget || 'all');
  const [ssoToggleState, setSsoToggleState] = useState(ssoEnabled ?? true);
  const [rzpButtonInput, setRzpButtonInput] = useState(razorpayButtonId || '');

  // Payment tab states
  const [payEnableUpi, setPayEnableUpi] = useState(enableInAppUpiUpgrade ?? true);
  const [payUpiId, setPayUpiId] = useState(upiId || 'medforum@upi');
  const [payPayeeName, setPayPayeeName] = useState(payeeName || 'MedForum Pediatrics');
  const [payEnableRzp, setPayEnableRzp] = useState(enableRazorpayButton ?? false);
  const [payRzpId, setPayRzpId] = useState(razorpayButtonId || '');
  const [payRates, setPayRates] = useState({
    plan_3m: planRates?.plan_3m || 2999,
    plan_6m: planRates?.plan_6m || 4999,
    plan_12m: planRates?.plan_12m || 7999
  });

  const [editingId, setEditingId] = useState(null);
  const [newAppearance, setNewAppearance] = useState({ exam: 'DNB', year: 2025, session: 'June', paper: '1' });
  const [adminPage, setAdminPage] = useState(1);
  const [manageFilter, setManageFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [localCurriculum, setLocalCurriculum] = useState({});
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [newChapterName, setNewChapterName] = useState({});
  const [selectedQuestion, setSelectedQuestion] = useState({});
  const [showAnnouncementPreview, setShowAnnouncementPreview] = useState(false);
  const [showTeaserPreview, setShowTeaserPreview] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => setAnnouncementText(announcement || ''), [announcement]);
  useEffect(() => setTeaserQCountText(teaserQuestionCount || '500+'), [teaserQuestionCount]);
  useEffect(() => setTeaserText(teaser || ''), [teaser]);
  useEffect(() => setUpgradeText(upgradeMsg || ''), [upgradeMsg]);
  useEffect(() => setInfoPopupText(infoPopupContent || ''), [infoPopupContent]);
  useEffect(() => setInfoPopupEnabled(showInfoPopup ?? false), [showInfoPopup]);
  useEffect(() => setTargetPlatform(infoPopupTarget || 'all'), [infoPopupTarget]);
  useEffect(() => setSsoToggleState(ssoEnabled ?? true), [ssoEnabled]);
  useEffect(() => setRzpButtonInput(razorpayButtonId || ''), [razorpayButtonId]);
  useEffect(() => setPayEnableUpi(enableInAppUpiUpgrade ?? true), [enableInAppUpiUpgrade]);
  useEffect(() => setPayUpiId(upiId || 'medforum@upi'), [upiId]);
  useEffect(() => setPayPayeeName(payeeName || 'MedForum Pediatrics'), [payeeName]);
  useEffect(() => setPayEnableRzp(enableRazorpayButton ?? false), [enableRazorpayButton]);
  useEffect(() => setPayRzpId(razorpayButtonId || ''), [razorpayButtonId]);
  useEffect(() => {
    if (planRates) {
      setPayRates({
        plan_3m: planRates.plan_3m || 2999,
        plan_6m: planRates.plan_6m || 4999,
        plan_12m: planRates.plan_12m || 7999
      });
    }
  }, [planRates]);
  useEffect(() => {
    if (curriculumMap) setLocalCurriculum(curriculumMap);
  }, [curriculumMap]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  const startEdit = (q) => {
    setFormData({ ...q, originalAccessLevel: q.accessLevel || (q.collection === 'questions_gold' ? 'gold' : 'standard') });
    setTargetCollection((q.accessLevel === 'gold' || q.collection === 'questions_gold') ? 'questions_gold' : 'questions');
    setEditingId(q.id); setActiveTab('add');
  };
  const cancelEdit = () => { setEditingId(null); setFormData({ questionText: '', answerText: '', mnemonic: '', topic: '', importance: 'Low', appearances: [] }); setTargetCollection('questions'); };
  const addAppearance = () => { setFormData(prev => ({ ...prev, appearances: [...prev.appearances, newAppearance.exam === 'BONUS' ? { exam: 'BONUS', year: '', session: '', paper: '' } : { ...newAppearance, year: Number(newAppearance.year) }] })); };
  const formatAppearanceLabel = (app) => {
    if (!app) return '';
    if (app.exam === 'BONUS') return 'BONUS';
    const year = app.year || '—';
    const session = app.session || '—';
    const paper = app.paper ? `Paper ${app.paper}` : 'Paper —';
    return `${app.exam} • ${year} • ${session} • ${paper}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault(); if (!formData.questionText || !formData.answerText) return alert("Fill Q&A");
    if (editingId) {
      // build update payload without persisting legacy 'collection' fields
      const updatedData = {
        ...formData,
        id: editingId,
        accessLevel: targetCollection === 'questions_gold' ? 'gold' : 'standard'
      };
      // ensure originalAccessLevel is present for migration logic (kept only in payload, not stored permanently)
      if (!updatedData.originalAccessLevel) updatedData.originalAccessLevel = formData.originalAccessLevel || (formData.collection === 'questions_gold' ? 'gold' : (formData.collection === 'questions' ? 'standard' : undefined));
      updateQuestion(updatedData); cancelEdit();
    } else {
      // sanitize new question payload: don't persist legacy 'collection' fields, keep accessLevel
      const newQ = { ...formData, accessLevel: targetCollection === 'questions_gold' ? 'gold' : 'standard' };
      addQuestion(newQ, targetCollection); cancelEdit();
    }
  };

  useEffect(() => { setAdminPage(1); }, [adminSearchTerm, manageFilter]);
  const filteredManageQuestions = questions.filter(q => {
    const isGoldQ = q.accessLevel === 'gold' || q.collection === 'questions_gold';
    const matchesCollection = manageFilter === 'all' || (manageFilter === 'gold' && isGoldQ) || (manageFilter === 'standard' && !isGoldQ);
    const matchesSearch = q.questionText.toLowerCase().includes(adminSearchTerm.toLowerCase()) || (q.topic && q.topic.toLowerCase().includes(adminSearchTerm.toLowerCase()));
    return matchesCollection && matchesSearch;
  });
  const currentManageQuestions = filteredManageQuestions.slice((adminPage - 1) * itemsPerPage, adminPage * itemsPerPage);

  const handleAddChapter = (topic) => {
    if (!newChapterName[topic]) return;
    const newChapter = { id: 'chap_' + Date.now(), name: newChapterName[topic], questionIds: [] };
    setLocalCurriculum(prev => ({ ...prev, [topic]: [...(prev[topic] || []), newChapter] }));
    setNewChapterName(prev => ({ ...prev, [topic]: '' }));
  };

  const handleDeleteChapter = (topic, chapterId) => {
    if (!confirm('Delete this chapter?')) return;
    setLocalCurriculum(prev => ({ ...prev, [topic]: (prev[topic] || []).filter(c => c.id !== chapterId) }));
  };

  const handleAddQuestionToChapter = (topic, chapterId) => {
    const qId = selectedQuestion[chapterId];
    if (!qId) return;
    setLocalCurriculum(prev => ({
      ...prev,
      [topic]: (prev[topic] || []).map(chap => chap.id === chapterId && !chap.questionIds.includes(qId) ? { ...chap, questionIds: [...chap.questionIds, qId] } : chap)
    }));
    setSelectedQuestion(prev => ({ ...prev, [chapterId]: '' }));
  };

  const handleRemoveQuestion = (topic, chapterId, qId) => {
    setLocalCurriculum(prev => ({
      ...prev,
      [topic]: (prev[topic] || []).map(chap => chap.id === chapterId ? { ...chap, questionIds: chap.questionIds.filter(id => id !== qId) } : chap)
    }));
  };

  const handleMoveQuestion = (topic, chapterId, index, direction) => {
    setLocalCurriculum(prev => ({
      ...prev,
      [topic]: (prev[topic] || []).map(chap => {
        if (chap.id !== chapterId) return chap;
        const newQIds = [...chap.questionIds];
        if (direction === 'up' && index > 0) {
          [newQIds[index - 1], newQIds[index]] = [newQIds[index], newQIds[index - 1]];
        } else if (direction === 'down' && index < newQIds.length - 1) {
          [newQIds[index + 1], newQIds[index]] = [newQIds[index], newQIds[index + 1]];
        }
        return { ...chap, questionIds: newQIds };
      })
    }));
  };

  const getOrderedTopics = () => {
    const savedOrder = localCurriculum._sectionOrder || Object.keys(localCurriculum).filter(k => k !== '_sectionOrder');
    const topicsSet = new Set(savedOrder);
    uniqueTopics.forEach(t => topicsSet.add(t));
    return Array.from(topicsSet);
  };

  const handleMoveSection = (index, direction) => {
    const currentTopics = getOrderedTopics();
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentTopics.length) return;

    const newTopics = [...currentTopics];
    [newTopics[index], newTopics[targetIndex]] = [newTopics[targetIndex], newTopics[index]];

    setLocalCurriculum(prev => {
      const updated = { ...prev, _sectionOrder: newTopics };
      newTopics.forEach(topic => {
        if (prev[topic]) updated[topic] = prev[topic];
      });
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto pb-2 scrollbar-hide">
        <button onClick={() => { setActiveTab('add'); cancelEdit(); }} className={`text-sm font-medium whitespace-nowrap px-1 ${activeTab === 'add' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500'}`}> {editingId ? 'Edit Question' : 'Add Question'} </button>
        <button onClick={() => setActiveTab('manage')} className={`text-sm font-medium whitespace-nowrap px-1 ${activeTab === 'manage' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500'}`}> Manage Qs ({filteredManageQuestions.length}) </button>
        <button onClick={() => setActiveTab('curriculum')} className={`text-sm font-medium whitespace-nowrap px-1 ${activeTab === 'curriculum' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500'}`}> Curriculum </button>
        <button onClick={() => setActiveTab('announcements')} className={`text-sm font-medium whitespace-nowrap px-1 ${activeTab === 'announcements' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500'}`}> Settings </button>
        <button onClick={() => setActiveTab('payments')} className={`text-sm font-medium whitespace-nowrap px-1 flex items-center gap-1.5 ${activeTab === 'payments' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500'}`}> <CreditCard size={15} /> Payments </button>
      </div>

      {activeTab === 'add' && (
        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in zoom-in-95">
          {editingId && (
            <div className="bg-slate-100 dark:bg-gray-700/60 p-2.5 rounded-lg border border-slate-200 dark:border-gray-600 flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-300 font-medium">Database Document Ref ID:</span>
              <span
                className="font-mono font-bold text-teal-700 dark:text-teal-400 bg-white dark:bg-gray-800 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800 select-all cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-950/40"
                title="Click to copy ID"
                onClick={() => navigator.clipboard?.writeText(editingId)}
              >
                {editingId}
              </span>
            </div>
          )}
          <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
            <label className="block text-xs font-bold text-amber-800 dark:text-amber-200 mb-1 uppercase">Target Audience</label>
            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={targetCollection === 'questions'} onChange={() => setTargetCollection('questions')} className="text-teal-600" /><span className="text-sm font-medium dark:text-gray-200">Standard</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={targetCollection === 'questions_gold'} onChange={() => setTargetCollection('questions_gold')} className="text-amber-600" /><span className="text-sm font-medium flex items-center gap-1 dark:text-gray-200"><Crown size={14} className="text-amber-500" /> Gold Users</span></label>
            </div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Question</label><textarea className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white" rows={2} value={formData.questionText} onChange={e => setFormData({ ...formData, questionText: e.target.value })} /></div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Answer</label>
            <RichTextEditor
              value={formData.answerText}
              onChange={val => setFormData({ ...formData, answerText: val })}
              placeholder="Format answers with headings, lists, and links..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mnemonic / High Yield (Optional)</label>
            <RichTextEditor
              value={formData.mnemonic || ''}
              onChange={val => setFormData({ ...formData, mnemonic: val })}
              placeholder="Enter mnemonic or key points..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Topic</label><input type="text" list="topic-suggestions" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white" value={formData.topic} onChange={e => setFormData({ ...formData, topic: e.target.value })} /><datalist id="topic-suggestions">{uniqueTopics.map(t => <option key={t} value={t} />)}</datalist></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Importance</label><select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white" value={formData.importance} onChange={e => setFormData({ ...formData, importance: e.target.value })}><option>Low</option><option>Medium</option><option>High</option></select></div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Appearances</label>
            <div className="flex flex-wrap gap-2 mb-2 items-stretch">
              <select className="flex-1 min-w-[70px] text-xs border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded p-1" value={newAppearance.exam} onChange={e => { const val = e.target.value; if (val === 'BONUS') setNewAppearance({ exam: 'BONUS', year: '', session: '', paper: '' }); else setNewAppearance({ exam: val, year: 2025, session: 'June', paper: '1' }); }}>{EXAM_TYPES.map(e => <option key={e}>{e}</option>)}</select>
              {newAppearance.exam === 'BONUS' ? <div className="flex-[3] flex items-center justify-center text-[10px] text-purple-600 font-bold bg-purple-50 rounded px-2">BONUS</div> : <><select className="flex-1 min-w-[60px] text-xs border border-gray-300 dark:bg-gray-700 dark:text-white rounded p-1" value={newAppearance.year} onChange={e => setNewAppearance({ ...newAppearance, year: e.target.value })}>{YEARS.map(y => <option key={y}>{y}</option>)}</select><select className="flex-1 min-w-[70px] text-xs border border-gray-300 dark:bg-gray-700 dark:text-white rounded p-1" value={newAppearance.session} onChange={e => setNewAppearance({ ...newAppearance, session: e.target.value })}>{SESSIONS.map(s => <option key={s}>{s}</option>)}</select><select className="flex-1 min-w-[50px] text-xs border border-gray-300 dark:bg-gray-700 dark:text-white rounded p-1" value={newAppearance.paper} onChange={e => setNewAppearance({ ...newAppearance, paper: e.target.value })}>{PAPERS[newAppearance.exam]?.map(p => <option key={p} value={p}>{p}</option>)}</select></>}
              <button type="button" onClick={addAppearance} className="flex-none px-3 bg-teal-600 text-white rounded py-1"><Plus size={14} /></button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">{formData.appearances.map((app, idx) => (<span key={idx} className="text-xs px-2 py-1 rounded flex items-center gap-1 bg-white border max-w-full"> <span className="truncate">{formatAppearanceLabel(app)}</span> <button type="button" onClick={() => setFormData(prev => ({ ...prev, appearances: prev.appearances.filter((_, i) => i !== idx) }))}><X size={12} className="text-red-400" /></button></span>))}</div>
          </div>
          <div className="flex gap-3 pt-2"><button type="submit" className="flex-1 bg-teal-600 text-white py-2 rounded-lg font-medium hover:bg-teal-700 flex items-center justify-center gap-2"><Save size={18} /> {editingId ? 'Update' : 'Save'}</button><button type="button" onClick={() => { cancelEdit(); setActiveTab('manage'); }} className="px-4 border rounded-lg hover:bg-gray-50 dark:text-white">Cancel</button></div>
        </form>
      )}

      {activeTab === 'manage' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-300">Filter:</div>
            <div className="flex gap-1">
              <button onClick={() => setManageFilter('all')} className={`px-2 py-1 text-xs rounded ${manageFilter === 'all' ? 'bg-teal-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>All</button>
              <button onClick={() => setManageFilter('standard')} className={`px-2 py-1 text-xs rounded ${manageFilter === 'standard' ? 'bg-teal-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>Standard</button>
              <button onClick={() => setManageFilter('gold')} className={`px-2 py-1 text-xs rounded ${manageFilter === 'gold' ? 'bg-teal-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>Gold</button>
            </div>
            <div className="ml-auto text-xs text-gray-500">Showing {filteredManageQuestions.length} of {questions.length}</div>
          </div>
          <div className="relative"><Search className="absolute left-3 top-2.5 text-gray-400" size={18} /><input type="text" placeholder="Search questions..." className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border rounded-xl text-sm dark:text-white" value={adminSearchTerm} onChange={(e) => setAdminSearchTerm(e.target.value)} /></div>
          <div className="space-y-2">{currentManageQuestions.length > 0 ? currentManageQuestions.map(q => <QuestionCard key={q.id} data={q} isAdmin={true} onDelete={deleteQuestion} onEdit={startEdit} isExpanded={expandedId === q.id} onToggle={() => setExpandedId(prev => prev === q.id ? null : q.id)} userRole={userRole} teaser={teaser} upgradeMsg={upgradeMsg} />) : <div className="text-center py-8 text-gray-400">No matching questions.</div>}</div>
          {filteredManageQuestions.length > itemsPerPage && (
            <div className="flex justify-center items-center gap-4 pt-2">
              <button onClick={() => { setAdminPage(p => Math.max(p - 1, 1)); scrollToTop(); }} disabled={adminPage === 1} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"><ChevronLeft size={20} className="dark:text-white" /></button>
              <span className="text-xs dark:text-white">Page {adminPage} of {Math.ceil(filteredManageQuestions.length / itemsPerPage)}</span>
              <button onClick={() => { setAdminPage(p => Math.min(p + 1, Math.ceil(filteredManageQuestions.length / itemsPerPage))); scrollToTop(); }} disabled={adminPage === Math.ceil(filteredManageQuestions.length / itemsPerPage)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"><ChevronRight size={20} className="dark:text-white" /></button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'curriculum' && (
        <div className="space-y-4 animate-in fade-in zoom-in-95 pb-10">
          <div className="flex justify-between items-center bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg border border-teal-200 dark:border-teal-800">
            <div>
              <h3 className="font-bold text-teal-800 dark:text-teal-200 flex items-center gap-2"><Layout size={18} /> Curriculum Builder</h3>
              <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">Organize questions into chapters to create a structured study plan.</p>
            </div>
            <button onClick={() => saveCurriculumMap(localCurriculum)} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm shrink-0"><Save size={16} /> Save Map</button>
          </div>

          <div className="space-y-2">
            {getOrderedTopics().map((topic, topicIndex, topicsArr) => {
              const isExpanded = expandedTopic === topic;
              const topicChapters = localCurriculum[topic] || [];
              const topicQuestions = questions.filter(q => q.topic === topic);

              return (
                <div key={topic} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <button onClick={() => setExpandedTopic(isExpanded ? null : topic)} className="flex-1 p-4 flex justify-between items-center text-left">
                      <span className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                        {topic} <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">{topicChapters.length} Chapters</span>
                      </span>
                      {isExpanded ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
                    </button>
                    <div className="flex items-center gap-1 pr-3 border-l border-gray-200 dark:border-gray-700 pl-2 shrink-0">
                      <button type="button" onClick={(e) => { e.stopPropagation(); handleMoveSection(topicIndex, 'up'); }} disabled={topicIndex === 0} title="Move Section Up" className="p-1 text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400 disabled:opacity-20 transition-colors rounded hover:bg-gray-200 dark:hover:bg-gray-700"><ChevronUp size={18} /></button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); handleMoveSection(topicIndex, 'down'); }} disabled={topicIndex === topicsArr.length - 1} title="Move Section Down" className="p-1 text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400 disabled:opacity-20 transition-colors rounded hover:bg-gray-200 dark:hover:bg-gray-700"><ChevronDown size={18} /></button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4 bg-white dark:bg-gray-800">
                      {topicChapters.length > 0 ? (
                        <div className="space-y-4">
                          {topicChapters.map(chapter => (
                            <div key={chapter.id} className="border border-indigo-100 dark:border-indigo-900/50 rounded-lg p-3 bg-indigo-50/30 dark:bg-indigo-900/10">
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="font-bold text-indigo-800 dark:text-indigo-300 text-sm flex items-center gap-1"><BookOpen size={14} /> {chapter.name}</h4>
                                <button onClick={() => handleDeleteChapter(topic, chapter.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                              </div>

                              {chapter.questionIds.length > 0 ? (
                                <div className="space-y-1.5 mb-3">
                                  {chapter.questionIds.map((qId, index) => {
                                    const q = questions.find(qu => qu.id === qId);
                                    return (
                                      <div key={qId} className="flex justify-between items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 rounded text-xs shadow-sm">
                                        <div className="truncate pr-2 flex-1 text-gray-700 dark:text-gray-300 font-medium">
                                          <span className="text-gray-400 mr-2">{index + 1}.</span>
                                          {q ? q.questionText : <span className="text-red-500">Deleted Question (ID: {qId})</span>}
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <button type="button" onClick={() => handleMoveQuestion(topic, chapter.id, index, 'up')} disabled={index === 0} className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30"><ChevronUp size={14} /></button>
                                          <button type="button" onClick={() => handleMoveQuestion(topic, chapter.id, index, 'down')} disabled={index === chapter.questionIds.length - 1} className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30"><ChevronDown size={14} /></button>
                                          <button type="button" onClick={() => handleRemoveQuestion(topic, chapter.id, qId)} className="p-1 text-gray-400 hover:text-red-500 ml-1 border-l border-gray-200 dark:border-gray-700 pl-2"><X size={14} /></button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-400 dark:text-gray-500 mb-3 italic px-2">No questions assigned to this chapter yet.</div>
                              )}

                              <div className="flex gap-2">
                                <select className="flex-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500" value={selectedQuestion[chapter.id] || ''} onChange={e => setSelectedQuestion(prev => ({ ...prev, [chapter.id]: e.target.value }))}>
                                  <option value="">-- Select a Question to Add --</option>
                                  {topicQuestions.filter(q => !chapter.questionIds.includes(q.id)).map(q => (
                                    <option key={q.id} value={q.id}>{q.questionText.substring(0, 70)}...</option>
                                  ))}
                                </select>
                                <button type="button" onClick={() => handleAddQuestionToChapter(topic, chapter.id)} disabled={!selectedQuestion[chapter.id]} className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-md text-xs font-bold hover:bg-indigo-200 disabled:opacity-50 flex items-center gap-1 shrink-0 transition-colors"><Plus size={14} /> Add</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 mb-3 text-center py-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">No chapters created for {topic} yet.</div>
                      )}

                      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <input type="text" placeholder="Enter new chapter name..." className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-teal-500" value={newChapterName[topic] || ''} onChange={e => setNewChapterName(prev => ({ ...prev, [topic]: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') handleAddChapter(topic); }} />
                        <button type="button" onClick={() => handleAddChapter(topic)} disabled={!newChapterName[topic]} className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 shrink-0 transition-colors"><Plus size={16} /> Create Chapter</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'announcements' && (
        <div className="space-y-6 animate-in fade-in zoom-in-95">
          {/* Announcement Banner Editor */}
          <div className="bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-900/30 p-5 rounded-2xl shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <Megaphone size={18} className="text-blue-500" />
              Global Announcement Banner
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
              Broadcast HTML messages or alerts shown at the top of student question feeds.
            </p>
            <textarea
              className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono h-28 mb-3 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g. <b>New June 2025 PYQ Added!</b> Upgrade to Gold to unlock explanations."
              value={announcementText}
              onChange={e => setAnnouncementText(e.target.value)}
            />
            <div className="flex justify-end">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAnnouncementPreview(prev => !prev)}
                  className="bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm transition-all"
                >
                  Preview
                </button>
                <button
                  onClick={() => { saveAnnouncement(announcementText); setShowAnnouncementPreview(false); }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
                >
                  <Save size={16} /> Save Announcement
                </button>
              </div>
            </div>
          </div>
          {showAnnouncementPreview && (
            <div className="mt-4 bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-900/30 p-4 rounded-lg">
              <h4 className="text-sm font-bold text-blue-800 dark:text-blue-200 mb-2">Announcement Preview</h4>
              <SafeHtmlContent className="text-sm text-gray-800 dark:text-gray-200 prose max-w-none" html={announcementText || '<em>No announcement</em>'} />
            </div>
          )}



          {/* Teaser Message Card */}
          <div className="bg-white dark:bg-gray-800 border border-amber-100 dark:border-amber-900/30 p-5 rounded-2xl shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" />
              Upgrade Teaser Promo Message
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
              Promotional content displayed inside gold teaser upgrade cards for non-gold users. Saved to Cloud Firestore.
            </p>
            <textarea
              className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono h-24 mb-3 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              placeholder="e.g. Upgrade to GOLD to unlock premium questions!"
              value={teaserText}
              onChange={e => setTeaserText(e.target.value)}
            />
            <div className="flex justify-end">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowTeaserPreview(prev => !prev)}
                  className="bg-white border border-amber-200 hover:bg-amber-50 text-amber-700 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm transition-all"
                >
                  Preview
                </button>
                <button
                  onClick={() => { saveTeaserMessage(teaserText); setShowTeaserPreview(false); }}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
                >
                  <Save size={16} /> Save Teaser Message
                </button>
              </div>
            </div>
          </div>
          {/* Upgrade Message Card */}
          <div className="bg-white dark:bg-gray-800 border border-amber-100 dark:border-amber-900/30 p-5 rounded-2xl shadow-sm mt-4">
            <h3 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <Crown size={18} className="text-amber-500" />
              Upgrade Message
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
              Message shown inside locked gold answer cards to non-gold users. Saved to Cloud Firestore.
            </p>
            <textarea
              className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono h-24 mb-3 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              placeholder="e.g. 🔒 High-yield answers & mnemonics are reserved for GOLD members. <a href='https://dnbpedia.in/pyq/memberships' target='_blank'>UPGRADE NOW ⚡</a>"
              value={upgradeText}
              onChange={e => setUpgradeText(e.target.value)}
            />
            <div className="flex justify-end">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { saveUpgradeMessage(upgradeText); }}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
                >
                  <Save size={16} /> Save Upgrade Message
                </button>
              </div>
            </div>
          </div>

          {/* HTML Popup Notification Modal Editor */}
          <div className="bg-white dark:bg-gray-800 border border-teal-100 dark:border-teal-900/30 p-5 rounded-2xl shadow-sm mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Info size={18} className="text-teal-600 dark:text-teal-400" />
                HTML Popup Notification Modal (24h Expiry)
              </h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={infoPopupEnabled}
                  onChange={e => setInfoPopupEnabled(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600"></div>
                <span className="ml-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {infoPopupEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
              Configure HTML popup message shown once every 24 hours when users open the app.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">
                Target Platform
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetPlatform('all')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${targetPlatform === 'all'
                    ? 'bg-teal-50 dark:bg-teal-900/40 border-teal-500 text-teal-700 dark:text-teal-300 shadow-sm'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                >
                  <Globe size={14} /> Both (Web & Mobile)
                </button>
                <button
                  type="button"
                  onClick={() => setTargetPlatform('web')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${targetPlatform === 'web'
                    ? 'bg-teal-50 dark:bg-teal-900/40 border-teal-500 text-teal-700 dark:text-teal-300 shadow-sm'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                >
                  <Laptop size={14} /> Web App Only
                </button>
                <button
                  type="button"
                  onClick={() => setTargetPlatform('android')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${targetPlatform === 'android'
                    ? 'bg-teal-50 dark:bg-teal-900/40 border-teal-500 text-teal-700 dark:text-teal-300 shadow-sm'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                >
                  <Smartphone size={14} /> Android App Only
                </button>
              </div>
            </div>
            <textarea
              className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono h-28 mb-3 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="e.g. <b>Welcome!</b> Check out the newly added June 2025 question bank."
              value={infoPopupText}
              onChange={e => setInfoPopupText(e.target.value)}
            />
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setIsInfoModalOpen(true)}
                className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
              >
                <Eye size={14} /> Preview Popup
              </button>
              <button
                onClick={() => saveInfoPopupSettings(infoPopupText, infoPopupEnabled, targetPlatform)}
                className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
              >
                <Save size={16} /> Save Popup Settings
              </button>
            </div>
          </div>

          {/* WordPress SSO Single Sign-On Enable / Disable Compact Card */}
          <div className="bg-white dark:bg-gray-800 border border-indigo-100 dark:border-indigo-900/30 p-3.5 rounded-xl shadow-sm mt-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`p-2 rounded-lg shrink-0 ${ssoToggleState ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                <ShieldCheck size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate">WordPress SSO Auto-Login</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${ssoToggleState ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                    {ssoToggleState ? 'Active' : 'Direct Links Only'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">Auto-logs users into dnbpedia.in via 1-time magic tokens</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-auto sm:ml-0">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={ssoToggleState}
                  onChange={e => setSsoToggleState(e.target.checked)}
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
              </label>
              <button
                onClick={() => saveSSOSettings(ssoToggleState)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <Save size={14} /> Save
              </button>
            </div>
          </div>
          {showTeaserPreview && (
            <div className="mt-4">
              <h4 className="text-sm font-bold text-amber-800 mb-2">Teaser Preview</h4>
              <div className="p-3">
                <div className="bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 shadow-sm relative overflow-hidden">
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-100 dark:bg-amber-800 p-2 rounded-full text-amber-600 dark:text-amber-200">
                      <Sparkles size={20} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-amber-900 dark:text-amber-100 text-sm mb-1">Premium Content Available</h4>
                      <SafeHtmlContent className="prose prose-sm prose-amber dark:prose-invert max-w-none text-amber-800 dark:text-amber-200 text-xs leading-relaxed" html={teaserText || '<em>No teaser</em>'} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 pb-10">
          <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white p-5 rounded-xl shadow-md flex items-center justify-between">
            <div>
              <h3 className="font-black text-lg flex items-center gap-2">
                <CreditCard size={22} /> Payment & Membership Settings
              </h3>
              <p className="text-xs text-amber-100 mt-1 font-medium">
                Manage In-App Direct UPI Upgrade, Razorpay Payment Gateway, Payee VPA, and Plan Rates.
              </p>
            </div>
          </div>

          {/* SECTION 1: Direct In-App UPI Upgrade Toggle & VPA Settings */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <div>
                <h4 className="font-extrabold text-sm text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  <Crown size={16} className="text-amber-500" /> Direct In-App UPI Upgrade System
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Toggle whether students see the built-in UPI Upgrade Screen or external WordPress membership link.
                </p>
              </div>

              {/* Yes / No Toggle Switch */}
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg border border-gray-200 dark:border-gray-600 shrink-0">
                <button
                  type="button"
                  onClick={() => setPayEnableUpi(true)}
                  className={`px-3 py-1 text-xs font-black rounded-md transition-all ${payEnableUpi ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'}`}
                >
                  YES (Active)
                </button>
                <button
                  type="button"
                  onClick={() => setPayEnableUpi(false)}
                  className={`px-3 py-1 text-xs font-black rounded-md transition-all ${!payEnableUpi ? 'bg-red-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'}`}
                >
                  NO (Deactive)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Default Payee UPI ID (VPA)
                </label>
                <input
                  type="text"
                  value={payUpiId}
                  onChange={(e) => setPayUpiId(e.target.value)}
                  placeholder="e.g. medforum@upi"
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-mono dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Payee Business / Doctor Name
                </label>
                <input
                  type="text"
                  value={payPayeeName}
                  onChange={(e) => setPayPayeeName(e.target.value)}
                  placeholder="e.g. MedForum Pediatrics"
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Plan Pricing Rates */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
            <h4 className="font-extrabold text-sm text-gray-800 dark:text-gray-100 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
              <Sparkles size={16} className="text-amber-500" /> Membership Plan Rates (₹ INR)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                <label className="block text-xs font-extrabold text-amber-900 dark:text-amber-200 mb-1">
                  3 Months Plan Rate (₹)
                </label>
                <input
                  type="number"
                  value={payRates.plan_3m}
                  onChange={(e) => setPayRates({ ...payRates, plan_3m: Number(e.target.value) })}
                  className="w-full p-2 border border-amber-300 dark:border-amber-700 rounded-lg text-sm font-bold dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                <label className="block text-xs font-extrabold text-amber-900 dark:text-amber-200 mb-1">
                  6 Months Plan Rate (₹)
                </label>
                <input
                  type="number"
                  value={payRates.plan_6m}
                  onChange={(e) => setPayRates({ ...payRates, plan_6m: Number(e.target.value) })}
                  className="w-full p-2 border border-amber-300 dark:border-amber-700 rounded-lg text-sm font-bold dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                <label className="block text-xs font-extrabold text-amber-900 dark:text-amber-200 mb-1">
                  12 Months Plan Rate (₹)
                </label>
                <input
                  type="number"
                  value={payRates.plan_12m}
                  onChange={(e) => setPayRates({ ...payRates, plan_12m: Number(e.target.value) })}
                  className="w-full p-2 border border-amber-300 dark:border-amber-700 rounded-lg text-sm font-bold dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Razorpay Payment Gateway Settings */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <div>
                <h4 className="font-extrabold text-sm text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  <CreditCard size={16} className="text-blue-500" /> Razorpay Payment Button & Link
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Configure Razorpay Payment Button ID or direct Razorpay Payment Page URL.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg border border-gray-200 dark:border-gray-600 shrink-0">
                <button
                  type="button"
                  onClick={() => setPayEnableRzp(true)}
                  className={`px-3 py-1 text-xs font-black rounded-md transition-all ${payEnableRzp ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'}`}
                >
                  YES (Active)
                </button>
                <button
                  type="button"
                  onClick={() => setPayEnableRzp(false)}
                  className={`px-3 py-1 text-xs font-black rounded-md transition-all ${!payEnableRzp ? 'bg-gray-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'}`}
                >
                  NO (Inactive)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Default Razorpay Payment Button ID / Payment URL
              </label>
              <input
                type="text"
                value={payRzpId}
                onChange={(e) => setPayRzpId(e.target.value)}
                placeholder="e.g. pl_P1a2B3c4D5e6F7 or https://pages.razorpay.com/..."
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-mono dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="bg-blue-50/70 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/60 p-3.5 rounded-xl text-xs space-y-2">
              <div className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <Code size={14} /> Shortcode Usage Cheatsheet:
              </div>
              <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
                Use shortcode <code>[razorpay_button]</code> or <code>[razorpay_button id="pl_XXXXXX"]</code> in any HTML content (Announcements, Upgrade Messages, Teasers, Popups, Solutions).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="bg-white dark:bg-gray-900 p-2 rounded border border-blue-100 dark:border-blue-900 text-blue-800 dark:text-blue-300">
                  <code>[razorpay_button]</code>
                  <div className="text-[10px] text-gray-500 font-sans mt-0.5">Embeds default button ID set above</div>
                </div>
                <div className="bg-white dark:bg-gray-900 p-2 rounded border border-blue-100 dark:border-blue-900 text-blue-800 dark:text-blue-300">
                  <code>[razorpay_button id="pl_ABC123"]</code>
                  <div className="text-[10px] text-gray-500 font-sans mt-0.5">Embeds specific custom Razorpay button</div>
                </div>
              </div>
            </div>
          </div>

          {/* SAVE BUTTON */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                savePaymentSettings({
                  enableInAppUpiUpgrade: payEnableUpi,
                  upiId: payUpiId,
                  payeeName: payPayeeName,
                  enableRazorpayButton: payEnableRzp,
                  razorpayButtonId: payRzpId,
                  planRates: payRates
                });
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 shadow-lg shadow-amber-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Save size={18} /> Save All Payment Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

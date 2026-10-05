import React, { useEffect, useRef, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';

/**
 * Lightweight native DOMParser-based HTML Sanitizer for XSS Prevention.
 * Strips script tags, iframe, inline event handlers (onerror/onload), and javascript: URIs,
 * while leaving rich formatting, inline colors, tables, images, and Razorpay shortcodes 100% intact.
 * 
 * @param {string} rawHtml 
 */
export function sanitizeHtmlForRender(rawHtml) {
  if (!rawHtml || typeof rawHtml !== 'string') return '';

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');

    // Remove high-risk executable tags
    doc.querySelectorAll('script, iframe, object, embed, form, input, button, select, textarea').forEach(el => el.remove());

    const allowedTags = new Set([
      'p', 'div', 'span', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'br', 'a', 'img',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'sub', 'sup', 'hr',
      'razorpay-button'
    ]);

    doc.body.querySelectorAll('*').forEach(el => {
      const tag = el.tagName.toLowerCase();

      // Unwrap disallowed tags but preserve text content
      if (!allowedTags.has(tag)) {
        el.replaceWith(...Array.from(el.childNodes));
        return;
      }

      // Strip dangerous attributes (e.g. onerror, onload, onclick, javascript: links)
      Array.from(el.attributes).forEach(attr => {
        const attrName = attr.name.toLowerCase();
        const attrVal = attr.value.trim().toLowerCase();

        // 1. Remove inline JS event handlers
        if (attrName.startsWith('on')) {
          el.removeAttribute(attr.name);
        }
        // 2. Prevent javascript: / vbscript: URI exploits in links and images
        else if ((attrName === 'href' || attrName === 'src') && (attrVal.startsWith('javascript:') || attrVal.startsWith('vbscript:'))) {
          el.removeAttribute(attr.name);
        }
      });
    });

    return doc.body.innerHTML;
  } catch (err) {
    console.warn('[Sanitize] Failed to parse HTML, fallback to string escape:', err);
    return rawHtml.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
  }
}

/**
 * Parses and replaces Razorpay shortcodes in HTML text:
 *   [razorpay_button]
 *   [razorpay_button id="pl_XXXXXX"]
 *   <razorpay-button id="pl_XXXXXX"></razorpay-button>
 * 
 * @param {string} htmlContent 
 * @param {string} defaultButtonId 
 */
export function processRazorpayShortcodes(htmlContent, defaultButtonId = '') {
  if (!htmlContent) return '';

  // Match [razorpay_button] or [razorpay_button id="..."] or [razorpay_button id='...']
  let processed = htmlContent.replace(/\[razorpay_button(?:\s+id=["']?([^"'\s\]]+)["']?)?\]/gi, (match, customId) => {
    const targetId = customId || defaultButtonId;
    if (!targetId) {
      return '<div class="p-2.5 border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs rounded-lg my-2 text-center">⚠️ <em>Razorpay Button ID not configured. Set default ID in Admin Panel settings.</em></div>';
    }
    return `<div class="razorpay-embed-wrapper my-3 flex justify-center text-center w-full" data-button-id="${targetId}"></div>`;
  });

  // Match <razorpay-button id="..."></razorpay-button>
  processed = processed.replace(/<razorpay-button(?:\s+id=["']?([^"'\s>]+)["']?)?\s*><\/razorpay-button>/gi, (match, customId) => {
    const targetId = customId || defaultButtonId;
    if (!targetId) return '';
    return `<div class="razorpay-embed-wrapper my-3 flex justify-center text-center w-full" data-button-id="${targetId}"></div>`;
  });

  return processed;
}

export function SafeHtmlContent({ html = '', className = '', style = {} }) {
  const containerRef = useRef(null);
  const { razorpayButtonId } = useAppContext();

  // Sanitize HTML first for XSS prevention, then process Razorpay shortcodes
  const finalHtml = useMemo(() => {
    const clean = sanitizeHtmlForRender(html);
    return processRazorpayShortcodes(clean, razorpayButtonId);
  }, [html, razorpayButtonId]);

  useEffect(() => {
    if (!containerRef.current) return;

    const wrappers = containerRef.current.querySelectorAll('.razorpay-embed-wrapper');
    wrappers.forEach((wrapper) => {
      const buttonId = wrapper.getAttribute('data-button-id');
      if (!buttonId) return;

      // Prevent duplicate form insertion if already mounted
      if (wrapper.querySelector('form')) return;

      wrapper.innerHTML = '';
      const form = document.createElement('form');
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/payment-button.js';
      script.setAttribute('data-payment_button_id', buttonId);
      script.async = true;

      form.appendChild(script);
      wrapper.appendChild(form);
    });
  }, [finalHtml, razorpayButtonId]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: finalHtml }}
    />
  );
}

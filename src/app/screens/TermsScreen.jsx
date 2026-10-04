import React from 'react';
import { Shield, BookOpen, FileText, CheckCircle, Lock, Mail } from 'lucide-react';
import { RestrictedAccessWrapper } from '../components/RestrictedAccessWrapper';

export function TermsScreen() {
  return (
    <RestrictedAccessWrapper title="Terms & Privacy">
      <div className="space-y-6 text-gray-600 dark:text-gray-300">
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg">
          <h3 className="font-bold text-amber-800 flex items-center gap-2 mb-2">
            <Shield size={18} /> Disclaimer </h3>
          <p className="text-xs text-amber-900 leading-relaxed">
            Medicine is a constantly changing field. New research and clinical experience broaden our knowledge constantly and continously, changes in protocols, treatment and drug therapy may become necessary or appropriate.
          </p>
          <p className="text-xs text-amber-900 leading-relaxed mt-2">
            The author and website hold no guarantee on the 100% accuracy of content. Absolute care and precaution has been taken in compiling the answers from standard sources. Readers are advised to check the most current information from standard text books.
          </p>
        </div>
        <section>
          <h3 className="font-bold text-indigo-600 flex items-center gap-2 mb-2">
            <BookOpen size={18} />
            Authenticated Sources
          </h3>
          <p className="text-sm leading-relaxed mb-2">
            The answers and study material provided in this application are primarily based on the following authenticated sources:
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 ml-1">
            <li><b>Nelson Textbook of Pediatrics</b></li>
            <li><b>O.P. Ghai Essential Pediatrics</b></li>
            <li>Standard Medical Journals</li>
            <li>Previous Year Question Papers (DNB/DCH)</li>
          </ul>
        </section>
        <section>
          <h3 className="font-bold text-indigo-600 flex items-center gap-2 mb-3">
            <BookOpen size={18} />
            Terms, Disclaimer &amp; Privacy Summary
          </h3>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p><strong>PediaQ by Medforum</strong></p>
            <p>
              <em>Last updated: [December 2025]</em>
            </p>
            <p>
              This page provides a <strong>combined summary</strong> of the
              <strong> Terms and Conditions, Disclaimer, and Privacy Policy</strong>
              applicable to the use of <strong>PediaQ by Medforum</strong>
              ("the App").
              <br />
              The <strong>complete and legally binding versions</strong> of these
              documents are available on our website at the links provided below.
            </p>
            <p>
              By installing, accessing, or using this App, you acknowledge that you
              have <strong>read, understood, and agreed</strong> to be bound by all
              the terms, disclaimers, and policies referenced herein.
            </p>
            <hr />
            <h4>1. Educational Disclaimer (Medical Non-Advice)</h4>
            <p>
              Pediatrics PYQ by Medforum is an
              <strong> educational platform</strong> intended
              <strong>{" "}solely for academic learning and postgraduate medical
                examination preparation
              </strong>.
            </p>
            <ul>
              <li>
                The App <strong>does not provide medical advice</strong>, diagnosis,
                treatment, or clinical guidance.
              </li>
              <li>
                The content must <strong>not be used for patient care or clinical
                  decision-making</strong>.
              </li>
              <li>
                All medical decisions must be made by a
                <strong> registered medical practitioner</strong> based on
                independent professional judgment, standard textbooks, clinical
                guidelines, and applicable laws.
              </li>
              <li>
                Use of the App is intended for
                <strong> qualified doctors, postgraduate medical students, and
                  legally authorized healthcare professionals</strong>.
              </li>
            </ul>
            <p>
              👉 Full Disclaimer:
              <br />
              <a href="https://dnbpedia.in/terms/disclaimers" target="_blank" rel="noreferrer" >
                https://dnbpedia.in/terms/disclaimers
              </a>
            </p>
            <hr />
            <h3>2. Terms of Use (Summary)</h3>
            <h4>Eligibility</h4>
            <ul>
              <li>
                The App is intended for use by
                <strong> medical professionals and postgraduate trainees</strong>.
              </li>
              <li>
                Users are responsible for ensuring compliance with applicable laws
                and professional regulations.
              </li>
            </ul>
            <h4>Content and Intellectual Property</h4>
            <ul>
              <li>All content is owned by <strong>Medforum</strong> or its licensors.</li>
              <li>
                Content may not be copied, shared, reproduced, or used commercially
                without permission.
              </li>
            </ul>
            <h4>Payments &amp; Subscriptions</h4>
            <ul>
              <li>Certain features may require payment.</li>
              <li>
                <strong>All payments are final and non-refundable</strong>, under all
                circumstances.
              </li>
            </ul>
            <h4>Advertisements &amp; Affiliations</h4>
            <ul>
              <li>
                The App may display advertisements via
                <strong> Google AdSense, Google Ads</strong>, and other advertising
                or affiliate partners.
              </li>
              <li>Medforum may earn revenue from ads or affiliate links.</li>
              <li>
                Medforum does <strong>not endorse</strong> third-party products or
                services.
              </li>
            </ul>
            <h4>Limitation of Liability</h4>
            <ul>
              <li>
                The App is provided on an
                <strong> "as is" and "as available"</strong> basis.
              </li>
              <li>
                Medforum is not liable for academic outcomes, exam results, clinical
                use, data loss, or damages arising from use of the App.
              </li>
            </ul>
            <h4>Termination</h4>
            <ul>
              <li>
                Medforum reserves the right to suspend or terminate access for
                violations of terms or misuse.
              </li>
            </ul>
            <h4>Governing Law</h4>
            <ul>
              <li>
                These terms are governed by the <strong>laws of India</strong>.
              </li>
              <li>Courts in India shall have exclusive jurisdiction.</li>
            </ul>
            <p>
              👉 Full Terms &amp; Conditions:
              <br />
              <a href="https://dnbpedia.in/terms" target="_blank" rel="noreferrer" >
                https://dnbpedia.in/terms
              </a>
            </p>
            <hr />
            <h3>3. Privacy &amp; Data Protection (Summary)</h3>
            <h4>Data Collection</h4>
            <ul>
              <li>
                Personal information (name, email, professional details, etc.) is
                collected <strong>only when voluntarily provided</strong>.
              </li>
              <li>
                Non-personal data (device info, usage analytics) may be collected
                automatically.
              </li>
            </ul>
            <h4>Use of Data</h4>
            <p>Data may be used for:</p>
            <ul>
              <li>Account management</li>
              <li>App functionality</li>
              <li>Analytics and improvement</li>
              <li><strong>Personalization of advertisements</strong></li>
            </ul>
            <h4>Cookies &amp; Tracking</h4>
            <ul>
              <li>
                The App and website use
                <strong> cookies and similar technologies</strong> for functionality,
                analytics, and advertising.
              </li>
              <li>Continued use of the App implies consent to cookie usage.</li>
            </ul>
            <h4><strong>Advertisements &amp; Third Parties</strong></h4>
            <ul>
              <li>
                Third-party ad partners may use cookies or tracking technologies.
              </li>
              <li>Medforum does not control third-party privacy practices.</li>
            </ul>
            <h4>Data Security</h4>
            <ul>
              <li>
                Reasonable technical and organizational safeguards are implemented.
              </li>
              <li>
                <strong>No guarantee of absolute security</strong> is made against
                breaches due to unforeseen or force-majeure circumstances.
              </li>
            </ul>
            <h4>Payments</h4>
            <ul>
              <li>Payments are processed via secure third-party gateways.</li>
              <li>
                Medforum does not store full payment card or banking information.
              </li>
            </ul>
            <h4>Children's Privacy</h4>
            <ul>
              <li>The App is not intended for individuals under 18 years of age.</li>
            </ul>
            <p>
              👉 Full Privacy Policy:
              <br />
              <a href="https://dnbpedia.in/privacy-policy" target="_blank" rel="noreferrer" >
                https://dnbpedia.in/privacy-policy
              </a>
            </p>
            <hr />
            <h3>4. User Consent</h3>
            <p>By using <strong>Pediatrics PYQ by Medforum</strong>, you confirm that:</p>
            <ul>
              <li>
                You are legally eligible to use the App as a medical professional or
                postgraduate trainee.
              </li>
              <li>
                You understand that the App is for
                <strong> educational purposes only</strong>.
              </li>
              <li>
                You consent to data collection, cookies, and advertisements as
                described.
              </li>
              <li>
                You agree to be bound by the full Terms, Disclaimer, and Privacy
                Policy available on our website.
              </li>
            </ul>
            <hr />
            <h3>5. Contact Information</h3>
            <p>
              For any legal, privacy, or policy-related queries, please contact:
              <br />
              <strong>Medforum</strong>
              <br />
              📧 [pediatrics@medforum.in]
            </p>
          </div>
        </section>
      </div>
    </RestrictedAccessWrapper >
  );
}

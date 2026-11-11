import { ContactPlaceholder, LegalLayout } from "./legal-layout.jsx"

const SECTIONS = [
  {
    title: "About this policy",
    body: (
      <p>
        This Privacy Policy explains what personal data REBYU collects, why, who it is shared with and
        the choices you have. It applies to the REBYU website, learner portal and institution portal.
        Where an institution or enterprise enrolled you, that organization also decides how your data
        is used for its program, and its own privacy notice applies alongside this one.
      </p>
    ),
  },
  {
    title: "What we collect",
    body: (
      <ul>
        <li><strong>Account details</strong>: name, email address, role, institution or department, and profile settings.</li>
        <li><strong>Learning activity</strong>: certifications you enroll in, lessons viewed, answers, scores, assessment attempts, study plans, flashcards, library items and practice history.</li>
        <li><strong>Assessment integrity events</strong>: during exams we record events such as leaving the exam window, pausing and exits, so that results can be trusted.</li>
        <li><strong>AI tutor conversations</strong>: the messages you send the tutor and its replies, plus any safety flags raised on them.</li>
        <li><strong>Community content</strong>: posts, comments, shared study sets and reports.</li>
        <li><strong>Files you upload</strong>: documents and attachments you add for study or to share.</li>
        <li><strong>Billing records</strong>: plan, amounts, invoices and payment status. Card and e-wallet details go straight to our payment provider and are not stored by REBYU.</li>
        <li><strong>Technical data</strong>: device and browser information, IP address, and logs needed to keep the Service secure and working.</li>
        <li><strong>Institution requests</strong>: institution name, contact person, email, phone number and address submitted through the partnership form.</li>
      </ul>
    ),
  },
  {
    title: "How we use it",
    body: (
      <ul>
        <li>To create and secure your account and let you sign in.</li>
        <li>To deliver lessons, exams and study tools, and to estimate your mastery so we can adapt questions and recommend what to study next.</li>
        <li>To run the AI tutor and generate study material from the topics or files you choose.</li>
        <li>To protect assessment integrity and keep the community safe, including reviewing safety alerts.</li>
        <li>To give institutions the progress, results and integrity reports for learners they enrolled.</li>
        <li>To process payments, issue invoices and manage subscriptions and seats.</li>
        <li>To send service emails such as verification, invitations, password resets and billing notices.</li>
        <li>To fix problems, measure performance and improve the Service.</li>
      </ul>
    ),
  },
  {
    title: "AI processing",
    body: (
      <>
        <p>
          When you use the AI tutor or AI generation, the relevant text (your message, the lesson
          context, or the content of a file you chose) is sent to third-party AI model providers to
          produce a response. We send only what the feature needs and do not sell this data.
        </p>
        <p>
          Avoid putting sensitive personal information (passwords, ID numbers, health details) into
          tutor chats or uploaded study files.
        </p>
      </>
    ),
  },
  {
    title: "Who we share it with",
    body: (
      <>
        <p>We do not sell your personal data. We share it only with:</p>
        <ul>
          <li><strong>Your institution or enterprise</strong>, if you were enrolled through one.</li>
          <li><strong>Other learners</strong>, only for content you choose to post or share in the community.</li>
          <li>
            <strong>Service providers</strong> that run parts of REBYU for us, under their own security and privacy terms, including:
            Supabase (authentication and database), Cloudflare R2 (file storage), Resend (email delivery),
            PayMongo (payments), Railway (application hosting) and AI model providers (tutor and content generation).
          </li>
          <li><strong>Authorities</strong>, when the law requires it or to protect someone's safety.</li>
        </ul>
      </>
    ),
  },
  {
    title: "How long we keep it",
    body: (
      <p>
        We keep account and learning data while your account is active. When an account is deleted,
        its attempts, study data and uploaded files are deleted with it. Some records, such as invoices
        and payment records, may be kept for as long as the law requires. Retention periods: [to be
        confirmed by the platform owner].
      </p>
    ),
  },
  {
    title: "Your rights",
    body: (
      <>
        <p>
          Depending on where you live (for example under the Philippine Data Privacy Act of 2012), you
          may have the right to:
        </p>
        <ul>
          <li>be informed about how your data is processed;</li>
          <li>access and get a copy of your data;</li>
          <li>correct inaccurate data;</li>
          <li>object to processing or withdraw consent;</li>
          <li>have your data deleted or blocked;</li>
          <li>file a complaint with the data protection authority.</li>
        </ul>
        <p>
          To use these rights, contact <ContactPlaceholder>[privacy contact email to be added]</ContactPlaceholder>.
          If you were enrolled by an institution, we may need to involve them.
        </p>
      </>
    ),
  },
  {
    title: "Security",
    body: (
      <p>
        We protect data with encrypted connections, access controls that scope each institution to its
        own learners, and limited staff access. No system is perfectly secure; if a breach affects your
        data we will notify you and the relevant authorities as the law requires.
      </p>
    ),
  },
  {
    title: "Cookies and local storage",
    body: (
      <p>
        REBYU uses browser storage that is needed for sign-in sessions and for remembering settings
        such as your study preferences. We do not use advertising cookies.
      </p>
    ),
  },
  {
    title: "Children",
    body: (
      <p>
        REBYU is meant for students and professionals preparing for certifications. If a learner is a
        minor, their institution or a parent or guardian is responsible for providing any required
        consent.
      </p>
    ),
  },
  {
    title: "Changes and contact",
    body: (
      <p>
        We will post updates to this policy here and notify you of significant changes. Our data
        protection contact is <ContactPlaceholder>[data protection officer / privacy contact to be added]</ContactPlaceholder>.
      </p>
    ),
  },
]

export default function PrivacyPage() {
  return (
    <LegalLayout
      eyebrow="legal"
      title="Privacy policy"
      intro="What REBYU collects about you, why we need it, and what you can do about it."
      sections={SECTIONS}
    />
  )
}

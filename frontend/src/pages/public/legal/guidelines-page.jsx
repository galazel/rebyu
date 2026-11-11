import { ContactPlaceholder, LegalLayout } from "./legal-layout.jsx"

const SECTIONS = [
  {
    title: "Why these guidelines exist",
    body: (
      <p>
        REBYU only works if results are honest and the community is a place people want to study in.
        These guidelines apply to everyone on the platform: learners, institution staff and REBYU
        moderators. They are part of the Terms of use.
      </p>
    ),
  },
  {
    title: "Academic integrity",
    body: (
      <>
        <p>Your scores help you, and your institution, see what you actually know. Keep them real:</p>
        <ul>
          <li>Take assessments yourself. No stand-ins, shared accounts or outside help on graded exams unless your institution says otherwise.</li>
          <li>Do not copy, photograph, screen-record or publish exam questions or answers.</li>
          <li>Do not use the AI tutor, other AI tools or other people to answer questions during a graded assessment.</li>
          <li>Do not try to get around timers, attempt limits, adaptive question selection or integrity checks.</li>
        </ul>
      </>
    ),
  },
  {
    title: "How integrity checks work",
    body: (
      <>
        <p>
          During exams REBYU records events such as leaving the exam window, pausing and exiting.
          These events appear in the attempt's integrity log, which your institution's staff can see.
        </p>
        <ul>
          <li>The exam clock is kept on our server, so pausing or reloading does not stop time.</li>
          <li>Leaving an exam too many times (currently three exits) forfeits the attempt with a score of 0%.</li>
          <li>Practice modes and challenges are more relaxed, but sharing their answers still breaks these guidelines.</li>
        </ul>
        <p>If something outside your control interrupted an exam, such as a power or connection loss, talk to your institution or contact <ContactPlaceholder />.</p>
      </>
    ),
  },
  {
    title: "Using the AI tutor well",
    body: (
      <>
        <p>The AI tutor is there to explain concepts, check your understanding and point you to resources. Please:</p>
        <ul>
          <li>Keep conversations about your studies.</li>
          <li>Do not try to make it produce harmful content, ignore its rules, or reveal other people's data.</li>
          <li>Double-check important facts; AI can make mistakes.</li>
        </ul>
        <p>
          Messages that suggest a threat to someone, a risk of self-harm, or an attempt to extract
          private data trigger a safety alert. You will see support information, and REBYU staff or
          your institution may follow up. If you are in danger or thinking about hurting yourself,
          please contact local emergency services or a crisis hotline right away.
        </p>
      </>
    ),
  },
  {
    title: "Community conduct",
    body: (
      <>
        <p>The community is for sharing reviewers, notes and help. Be the classmate you would want:</p>
        <ul>
          <li>Be respectful. No harassment, bullying, hate speech, threats or personal attacks.</li>
          <li>Stay on topic: certification study, tech careers and the subjects REBYU covers.</li>
          <li>No spam, advertising, scams or links to malware.</li>
          <li>No sexual, violent or otherwise inappropriate content.</li>
          <li>Do not post other people's personal information.</li>
          <li>Do not impersonate other learners, staff, institutions or certifying bodies.</li>
        </ul>
      </>
    ),
  },
  {
    title: "Sharing content and copyright",
    body: (
      <ul>
        <li>Share only notes, files and study sets you made or have the right to share.</li>
        <li>Do not post leaked or "recalled" questions from official certification exams.</li>
        <li>Credit sources when you summarize someone else's material.</li>
        <li>Uploaded files must be study-related and free of malware.</li>
      </ul>
    ),
  },
  {
    title: "Reporting and moderation",
    body: (
      <>
        <p>
          Use the report option on a post or comment to flag it. Moderators review reports and may hide
          or remove content. Hidden content cannot be copied into other learners' libraries.
        </p>
        <p>Depending on how serious the issue is, we may:</p>
        <ul>
          <li>remove the content and send a warning;</li>
          <li>limit community features for a period;</li>
          <li>forfeit assessment attempts involved in cheating;</li>
          <li>suspend or close the account, and inform the learner's institution.</li>
        </ul>
        <p>To appeal a decision, contact <ContactPlaceholder />.</p>
      </>
    ),
  },
  {
    title: "Institution staff",
    body: (
      <p>
        Administrators and department heads can see learner progress, results and integrity logs. Use
        them only to support your learners and run your program, treat integrity events as signals to
        look into rather than proof, and keep learner data confidential within your organization.
      </p>
    ),
  },
]

export default function GuidelinesPage() {
  return (
    <LegalLayout
      eyebrow="community"
      title="Guidelines"
      intro="How we keep REBYU fair and friendly: academic integrity, the AI tutor, and community conduct."
      sections={SECTIONS}
    />
  )
}

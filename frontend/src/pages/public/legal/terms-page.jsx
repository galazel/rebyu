import { Link } from "react-router-dom"
import { ContactPlaceholder, LegalLayout } from "./legal-layout.jsx"

const SECTIONS = [
  {
    title: "Agreeing to these terms",
    body: (
      <>
        <p>
          These Terms of Use govern your access to and use of REBYU, an online review platform for
          technical and industry certifications, including the website, learner portal, institution
          portal and every feature offered through them (together, the "Service").
        </p>
        <p>
          By creating an account or using the Service you agree to these terms, our{" "}
          <Link to="/privacy" className="font-bold text-rb-feather hover:underline">Privacy policy</Link>{" "}
          and our{" "}
          <Link to="/guidelines" className="font-bold text-rb-feather hover:underline">Community and integrity guidelines</Link>.
          If you do not agree, do not use the Service.
        </p>
      </>
    ),
  },
  {
    title: "Who can use REBYU",
    body: (
      <>
        <p>You may use the Service if you are able to form a binding agreement where you live. If you are a minor, a parent, guardian or your institution must agree to these terms for you.</p>
        <p>REBYU has two kinds of users:</p>
        <ul>
          <li><strong>Learners</strong>, who sign up on their own or are invited by an institution.</li>
          <li><strong>Institutions and enterprises</strong> (schools, training centers, companies), whose partnership requests we review before access is granted. Their administrators and department heads manage learners, groups and certification seats inside their organization.</li>
        </ul>
      </>
    ),
  },
  {
    title: "Your account",
    body: (
      <ul>
        <li>Give accurate information when you register and keep it up to date.</li>
        <li>Keep your password private. You are responsible for activity under your account.</li>
        <li>One person, one account. Do not share, sell or transfer accounts or institution seats.</li>
        <li>Tell us right away at <ContactPlaceholder /> if you think your account was accessed without permission.</li>
      </ul>
    ),
  },
  {
    title: "Using the Service",
    body: (
      <>
        <p>REBYU gives you lessons, practice questions, flashcards, quizzes, diagnostic, unit and mock exams, an AI tutor, study planning tools and a community space. You agree not to:</p>
        <ul>
          <li>break the law or anyone else's rights while using the Service;</li>
          <li>copy, scrape, resell or redistribute our question banks, lessons or exams;</li>
          <li>attempt to get around assessment integrity checks, access limits or payment controls;</li>
          <li>probe, attack or overload our systems, or access data that is not yours;</li>
          <li>upload malware or content you have no right to share;</li>
          <li>break the <Link to="/guidelines" className="font-bold text-rb-feather hover:underline">Guidelines</Link>.</li>
        </ul>
      </>
    ),
  },
  {
    title: "Practice exams are not official exams",
    body: (
      <>
        <p>
          REBYU is an independent review tool. It is not affiliated with, endorsed by or a
          substitute for any certifying body. Scores, mastery estimates, readiness predictions and
          study recommendations are guides to help you prepare. They do not guarantee that you will
          pass any official examination.
        </p>
        <p>
          Some past-paper questions are reproduced under the licence of their publisher and carry a
          source citation. Those questions remain the property of their original owner.
        </p>
      </>
    ),
  },
  {
    title: "AI tutor and AI-generated content",
    body: (
      <>
        <p>
          Parts of REBYU use artificial intelligence, including the AI tutor and AI-generated lessons,
          questions, quizzes, flashcards and study aids. AI output can be wrong, incomplete or out of
          date. Check important facts against official references before relying on them.
        </p>
        <ul>
          <li>The AI tutor is a study aid. It is not a source of medical, legal, financial or mental-health advice.</li>
          <li>Conversations may be reviewed automatically for safety. Messages that suggest a threat to someone, a risk of self-harm, or an attempt to extract other people's data may be flagged to REBYU staff or to your institution so that someone can follow up.</li>
          <li>Content you upload to generate study material must be content you have the right to use.</li>
        </ul>
      </>
    ),
  },
  {
    title: "Your content",
    body: (
      <>
        <p>
          You keep ownership of what you create or upload, such as notes, community posts, comments,
          study sets and files ("Your Content"). You give REBYU a non-exclusive, worldwide, royalty-free
          licence to store, process, display and share Your Content only as needed to run the Service.
          For example, to show a post you published to the community, or to generate a study aid from
          a document you uploaded.
        </p>
        <p>
          When you share content to the community, other learners can view it and, where the feature
          allows, copy it into their own library. You can delete your content at any time; copies
          other learners already saved may remain in their libraries.
        </p>
        <p>We may remove content that breaks these terms or the Guidelines.</p>
      </>
    ),
  },
  {
    title: "Our content",
    body: (
      <p>
        The Service, including its software, design, branding, lessons, question banks and exams, is
        owned by REBYU or its licensors and is protected by intellectual property laws. We give you a
        personal, non-transferable, revocable right to use it for your own study (or, for
        institutions, for your learners' study) while your account is active. Nothing else is
        licensed to you.
      </p>
    ),
  },
  {
    title: "Plans, payments and refunds",
    body: (
      <>
        <p>
          Some features are free. Others need a paid subscription (for learners) or an institution
          partnership with a set number of learner seats. Prices are shown before you pay.
        </p>
        <ul>
          <li>Payments are processed by our payment provider, PayMongo. REBYU does not store your full card or e-wallet details.</li>
          <li>Subscriptions renew according to the plan you chose until cancelled. You can cancel from your account; access continues until the end of the paid period.</li>
          <li>Institution partnerships, seat top-ups and add-ons are billed according to the approved request and the invoice issued for it.</li>
          <li>Refund policy: [to be defined by the platform owner]. Contact <ContactPlaceholder /> for billing questions.</li>
        </ul>
      </>
    ),
  },
  {
    title: "Institution responsibilities",
    body: (
      <p>
        Institutions and enterprises are responsible for the learners they invite, for having a valid
        reason and any required consent to add those learners, for how their administrators use
        learner progress, assessment and integrity reports, and for keeping their staff accounts
        secure. Institutions may see the progress, results and integrity events of learners enrolled
        through them.
      </p>
    ),
  },
  {
    title: "Suspension and termination",
    body: (
      <p>
        You may stop using REBYU and ask us to delete your account at any time. We may suspend or end
        access, or forfeit an assessment attempt, if you break these terms or the Guidelines, if
        required by law, or to protect other users or the Service. Where reasonable we will tell you
        why. Deleting an account removes the data attached to it as described in the Privacy policy.
      </p>
    ),
  },
  {
    title: "Availability and changes",
    body: (
      <p>
        We work to keep REBYU available and accurate, but the Service is provided "as is" and "as
        available". Features may change, and the Service may be interrupted for maintenance or for
        reasons outside our control. To the extent the law allows, REBYU is not liable for indirect or
        consequential losses, lost data or exam outcomes arising from use of the Service.
      </p>
    ),
  },
  {
    title: "Changes to these terms",
    body: (
      <p>
        We may update these terms. When changes are significant we will notify you by email or in the
        app before they take effect. Continuing to use the Service after that means you accept the
        updated terms.
      </p>
    ),
  },
  {
    title: "Governing law and contact",
    body: (
      <p>
        These terms are governed by the laws of [jurisdiction to be confirmed by the platform owner].
        Questions about these terms can be sent to <ContactPlaceholder />.
      </p>
    ),
  },
]

export default function TermsPage() {
  return (
    <LegalLayout
      eyebrow="legal"
      title="Terms of use"
      intro="The rules for using REBYU as a learner or as an institution, in plain language."
      sections={SECTIONS}
    />
  )
}

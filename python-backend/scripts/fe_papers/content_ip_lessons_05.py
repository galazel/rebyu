"""IT Passport lesson content: Human interface and Multimedia (748-751)."""

import sys

sys.path.insert(0, "/app/scripts/fe_expansion")

from builders import (  # noqa: E402
    accordion, compare_grid, content_tabs, desc, flip_cards, image, image_text,
    lesson_structure, media_text, ol, review_cards, sub, table, tabs, ul,
)

FIG = "/lesson-media/%s.svg"

CERTIFICATION_ID = 4

LESSONS = {}


LESSONS[748] = lesson_structure(
    name="Human interface technology",
    intro=(
        "A human interface is everything through which a person and a system exchange "
        "information. This lesson covers the interaction styles in use, what makes one "
        "easy or hard to learn, and why accessibility is a design requirement rather "
        "than an optional extra."
    ),
    objectives=[
        "Describe the main interaction styles and where each suits.",
        "Explain what usability means and how it is judged.",
        "Describe how response time affects the experience.",
        "Explain what accessibility requires of an interface.",
        "Describe common input methods beyond keyboard and mouse.",
        "Explain why consistency reduces effort.",
    ],
    minutes=30,
    sections=[
        ("Ways of interacting", [
            tabs([
                ("GUI", "Graphical user interface",
                 "Windows, icons, menus and a pointer. Discoverable -- options are "
                 "visible -- and slower for an expert doing the same task repeatedly."),
                ("CLI", "Command line interface",
                 "Typed commands. Steep to learn and far faster once learned, and "
                 "scriptable, which is why servers are still administered this way."),
                ("Touch", "Direct manipulation",
                 "Tapping and gestures on the object itself. Immediate and imprecise; "
                 "targets must be large enough for a fingertip."),
                ("Voice", "Spoken interaction",
                 "Hands-free and natural, and unreliable in noise or with unusual "
                 "vocabulary. Suits short commands rather than complex entry."),
            ]),
        ]),
        ("What usability means", [
            desc(
                "Usability is how effectively, efficiently and satisfyingly people can "
                "achieve their goals with a system. It is judged by observing users, not "
                "by asking designers."
            ),
            ul([
                "Learnability -- how quickly a newcomer becomes competent.",
                "Efficiency -- how fast an experienced user works.",
                "Memorability -- how much is retained after time away.",
                "Errors -- how often mistakes happen and how easily they are undone.",
                "Satisfaction -- whether using it is pleasant.",
            ]),
            desc(
                "These trade against each other. An interface optimised for a newcomer "
                "with confirmations and explanations slows an expert who performs the "
                "task fifty times a day."
            ),
        ]),
        ("Response time", [
            desc(
                "How quickly a system answers changes how it feels, and the thresholds "
                "are well established."
            ),
            image(FIG % "ip-fitts-law"),
            table(
                ["Delay", "How it is perceived", "What the interface should do"],
                [["Up to 0.1s", "Instantaneous", "Nothing -- it feels direct"],
                 ["Up to 1s", "Noticeable, thought unbroken", "Nothing, or a subtle cue"],
                 ["Up to 10s", "Attention wanders", "Show a progress indicator"],
                 ["Over 10s", "The user leaves", "Show progress and allow other work"]],
            ),
        ]),
        ("Designing for the hand and eye", [
            desc(
                "Pointing takes longer the further away and the smaller the target is. "
                "That is Fitts's law, and it has direct consequences."
            ),
            ul([
                "Frequent actions should be large and close to where the pointer already is.",
                "Screen edges and corners are effectively infinite targets -- the pointer cannot overshoot them.",
                "Dangerous actions should NOT be next to frequent ones.",
            ]),
        ]),
        ("Accessibility", [
            desc(
                "An interface that only some people can use excludes the rest. "
                "Accessibility is a requirement wherever a system serves the public or "
                "an organisation's own staff."
            ),
            accordion([
                ("Alt text", "A description of an informative image, read aloud by a screen reader and shown when the image fails."),
                ("Never colour alone", "Colour must be reinforced by an icon or label, or users with colour vision deficiency receive no signal."),
                ("Keyboard operation", "Everything must be reachable without a mouse, for users who cannot use one."),
                ("Contrast and text size", "Adjustable, and adequate by default, for low vision."),
                ("Captions and transcripts", "For deaf users -- and for anyone in a noisy or silent place."),
            ]),
        ]),
        ("Consistency", [
            desc(
                "Consistency means the same action looks the same and behaves the same "
                "everywhere. Its value is that knowledge transfers: learning one screen "
                "teaches the others."
            ),
            desc(
                "Every inconsistency is a small relearning cost, paid by every user, "
                "every time. That is why platform conventions are worth following even "
                "when a designer would prefer something else."
            ),
        ]),
        ("Recall practice", [
            desc("Cover each answer first."),
            flip_cards([
                ("Above what delay is a progress indicator needed?", "About 1 second",
                 "Beyond roughly a second the user's flow of thought breaks."),
                ("Why are screen corners good targets?", "They cannot be overshot",
                 "The pointer stops there, so they are effectively infinite."),
                ("Why is colour alone insufficient?", "Some users cannot perceive it",
                 "Reinforce with an icon or text label."),
                ("GUI or CLI for repeated bulk work?", "CLI",
                 "It is faster once learned and can be scripted."),
            ]),
        ]),
    ],
    key_terms=[
        ("GUI", "An interface of windows, icons, menus and a pointer."),
        ("CLI", "A typed command interface; steep to learn, fast and scriptable."),
        ("Usability", "How effectively, efficiently and satisfyingly goals are achieved."),
        ("Fitts's law", "Pointing time grows with distance and shrinks with target size."),
        ("Alt text", "A textual equivalent for an informative image."),
        ("Accessibility", "Designing so that people with disabilities can use the system."),
    ],
    summary=(
        "Interaction styles suit different users and tasks: a GUI is discoverable, a "
        "CLI is fast and scriptable, touch is direct and imprecise. Usability is "
        "measured by observing real users across learnability, efficiency, "
        "memorability, errors and satisfaction, and these trade against each other. "
        "Response thresholds around 0.1, 1 and 10 seconds decide what feedback is "
        "needed, Fitts's law governs target placement, and accessibility requirements "
        "decide who can use the system at all."
    ),
    exam_notes=[
        desc(
            "Accessibility questions appear regularly, most often about alt text or "
            "about colour not being the only signal. Response-time thresholds are also "
            "directly examinable."
        ),
        ul([
            "Beyond about one second, show progress.",
            "Colour must never be the sole carrier of information.",
            "A CLI beats a GUI for repetitive bulk work.",
        ]),
    ],
)


LESSONS[749] = lesson_structure(
    name="Interface design",
    intro=(
        "Interface design is the practical work of laying out screens and forms so that "
        "people can complete tasks without difficulty. This lesson covers screen layout, "
        "form design, error handling and the testing that shows whether a design works."
    ),
    objectives=[
        "Apply basic principles of screen layout.",
        "Design a form that reduces entry errors.",
        "Write error messages that help rather than blame.",
        "Explain what a prototype is for.",
        "Describe how usability testing is conducted.",
        "Explain why defaults matter.",
    ],
    minutes=30,
    sections=[
        ("Laying out a screen", [
            desc(
                "A layout guides the eye. Grouping, spacing and alignment do that work "
                "before any label is read, which is why a well-organised screen feels "
                "simpler even with the same content."
            ),
            ul([
                "Group related items and separate unrelated ones with space.",
                "Align elements to a grid; ragged edges read as disorder.",
                "Put the most important thing where the eye lands first.",
                "Use size and weight to signal importance, sparingly.",
                "Leave white space -- crowding is what makes a screen feel complex.",
            ]),
        ]),
        ("Designing forms", [
            desc(
                "Forms are where most data enters a system, and most entry errors are "
                "design faults rather than user carelessness."
            ),
            ol([
                "Ask only for what is genuinely needed -- every field costs completion rate.",
                "Label clearly, above or beside the field, never only as placeholder text.",
                "Show the expected format before entry, not after it fails.",
                "Choose the right control: a date picker prevents malformed dates entirely.",
                "Validate as the user goes, so problems surface near where they were made.",
                "Preserve what was typed when something fails -- never clear the form.",
            ]),
            desc(
                "Placeholder text that disappears on focus is a common trap: the user "
                "loses the instruction exactly when they need it, and a filled field "
                "becomes indistinguishable from an empty one for anyone reviewing."
            ),
        ]),
        ("Choosing controls", [
            table(
                ["Situation", "Control", "Why"],
                [["Two mutually exclusive options", "Radio buttons", "Both visible; one selectable"],
                 ["Independent on/off choices", "Checkboxes", "Each is separate"],
                 ["One of many options", "Drop-down list", "Saves space; hides the options"],
                 ["A date", "Date picker", "Prevents ambiguous or invalid formats"],
                 ["A value in a known range", "Slider or stepper", "Constrains input by design"],
                 ["Free text", "Text field", "Only when the answer truly cannot be constrained"]],
                caption="Constraining input in the control removes whole classes of error.",
            ),
        ]),
        ("Error messages", [
            compare_grid(
                "Two ways to report the same problem",
                "The second costs no more to write.",
                [("Unhelpful",
                  "\"Invalid input.\" Says what is wrong with the system's mood, not "
                  "what the person should do, and implies fault."),
                 ("Helpful",
                  "\"Enter the date as DD/MM/YYYY -- for example 23/09/2026.\" States "
                  "what is expected and gives an example.")],
            ),
            ul([
                "Say what happened, and what to do next.",
                "Put the message next to the field it concerns.",
                "Never blame the user; the design permitted the mistake.",
                "Never lose the data they already entered.",
            ]),
        ]),
        ("Defaults", [
            desc(
                "Most people accept a default. That makes defaults one of the most "
                "powerful design decisions available, and one of the easiest to set "
                "carelessly."
            ),
            desc(
                "A default should be the safest or most common choice. Defaulting a "
                "privacy setting to the most permissive option, or a form to opt-in, is "
                "a design decision with consequences the designer owns."
            ),
        ]),
        ("Prototyping and testing", [
            desc(
                "A prototype is a model built to answer a question before the real thing "
                "is made, ranging from a sketch on paper to a clickable mock-up."
            ),
            accordion([
                ("Paper prototype", "Sketches walked through with a user. Minutes to make, and invites honest criticism precisely because it is obviously unfinished."),
                ("Wireframe", "Layout and hierarchy without styling, so discussion stays on structure rather than colour."),
                ("Clickable prototype", "Navigable screens without working logic; tests whether the flow makes sense."),
            ]),
            desc(
                "Usability testing means watching a real user attempt a real task "
                "without help. What they do matters more than what they say afterwards, "
                "and five users reveal most of the serious problems."
            ),
        ]),
        ("Recall practice", [
            desc("Answer before turning each card."),
            flip_cards([
                ("Radio buttons or checkboxes for one-of-two?", "Radio buttons",
                 "Checkboxes are for independent on/off choices."),
                ("What is wrong with placeholder-only labels?", "The instruction vanishes on focus",
                 "Exactly when the user needs it, and filled looks like empty afterwards."),
                ("What should an error message include?", "What to do next",
                 "And an example of the expected format."),
                ("Why do defaults matter so much?", "Most people accept them",
                 "So the default should be the safest common choice."),
            ]),
        ]),
    ],
    key_terms=[
        ("Wireframe", "A layout sketch showing structure without visual styling."),
        ("Prototype", "A model built to answer a question before the real thing is made."),
        ("Usability testing", "Observing real users attempting real tasks without help."),
        ("Default", "The pre-selected option, which most users will accept."),
        ("Validation", "Checking entered data meets the expected format or range."),
        ("Placeholder", "Hint text inside a field; not a substitute for a label."),
    ],
    summary=(
        "Layout guides the eye through grouping, alignment and space before any label "
        "is read. Forms should ask only what is needed, label properly rather than by "
        "placeholder, and constrain input through the control itself, because most "
        "entry errors are design faults. Error messages should say what to do next and "
        "never discard entered data. Defaults are accepted by most users and must "
        "therefore be chosen deliberately, and prototypes plus observation of real "
        "users are how a design is checked before it is built."
    ),
    exam_notes=[
        desc(
            "Control-choice questions are common: radio buttons for mutually exclusive, "
            "checkboxes for independent. Error-message questions reward the option that "
            "tells the user what to do."
        ),
        ul([
            "A date picker removes format errors entirely.",
            "Validation should preserve, never clear, what was entered.",
            "Five users find most serious usability problems.",
        ]),
    ],
)


LESSONS[750] = lesson_structure(
    name="Multimedia technology",
    intro=(
        "Multimedia combines text, images, sound, video and animation. This lesson "
        "covers how each is encoded and compressed, the formats in common use, and how "
        "to judge the trade between file size and quality."
    ),
    objectives=[
        "Describe how images, audio and video are digitised.",
        "Distinguish lossy from lossless compression and choose between them.",
        "Calculate simple media file sizes.",
        "Name common formats and what each suits.",
        "Explain what streaming is and how it differs from downloading.",
        "Describe what codecs and containers do.",
    ],
    minutes=35,
    sections=[
        ("Digitising media", [
            desc(
                "All media begins as a continuous physical quantity and is converted to "
                "numbers by sampling it at intervals and rounding each sample. The "
                "sampling rate and the bit depth decide the fidelity and the size."
            ),
            image(FIG % "ip-digitising"),
        ]),
        ("Images", [
            desc(
                "A bitmap image is a grid of pixels. Size in bits is width x height x "
                "bits per pixel, before compression."
            ),
            compare_grid(
                "Raster against vector",
                "Chosen by what the image is, not by preference.",
                [("Raster (bitmap)",
                  "A grid of pixels. Necessary for photographs, which have no underlying "
                  "shapes. Becomes blocky when enlarged."),
                 ("Vector",
                  "Shapes and coordinates. Scales to any size without loss, which suits "
                  "logos, icons and diagrams.")],
            ),
        ]),
        ("Audio", [
            desc(
                "Audio is sampled thousands of times a second. CD quality is 44,100 "
                "samples per second at 16 bits, in two channels."
            ),
            desc(
                "Size = rate x depth x channels x seconds. One second is 44,100 x 16 x 2 "
                "= 1,411,200 bits, about 176 KB -- so an hour of uncompressed stereo "
                "audio is roughly 600 MB."
            ),
        ]),
        ("Video", [
            desc(
                "Video is a sequence of images with synchronised audio. Uncompressed it "
                "is enormous: 25 frames a second of 1,920 x 1,080 at 24 bits is about "
                "1.5 Gbit/s."
            ),
            desc(
                "It compresses well because consecutive frames are nearly identical, so "
                "only the differences need storing. Periodic full key frames let playback "
                "start partway through and recover from errors."
            ),
        ]),
        ("Compression choices", [
            image(FIG % "ip-compression"),
            table(
                ["Medium", "Lossless option", "Lossy option", "Choose lossy when"],
                [["Image", "PNG", "JPEG", "It is a photograph, and size matters"],
                 ["Audio", "FLAC", "MP3, AAC", "It is for listening, not editing"],
                 ["Video", "(rare)", "H.264, H.265", "Almost always -- lossless is impractical"],
                 ["Document", "ZIP", "(never)", "Never -- the content must be exact"]],
            ),
        ]),
        ("Codecs and containers", [
            desc(
                "A codec is the method used to compress and decompress a stream. A "
                "container is the file format holding one or more streams together with "
                "the information needed to play them in sync."
            ),
            desc(
                "This is why a file can have a familiar extension and still fail to "
                "play: the container is recognised, the codec inside it is not. MP4 is a "
                "container; H.264 is a codec commonly found inside one."
            ),
        ]),
        ("Streaming", [
            compare_grid(
                "Streaming against downloading",
                "The difference is when playback can start and what is left behind.",
                [("Download",
                  "The whole file arrives first, then plays. Works offline afterwards, "
                  "and occupies storage."),
                 ("Streaming",
                  "Plays as it arrives, buffering ahead. Starts almost immediately, "
                  "needs a sustained connection, and usually leaves nothing behind.")],
            ),
            desc(
                "Adaptive streaming adjusts quality to the available bandwidth mid-play, "
                "which is why a video becomes briefly blurry rather than stopping."
            ),
        ]),
        ("Recall practice", [
            desc("Cover each answer first."),
            flip_cards([
                ("Which scales without loss: raster or vector?", "Vector",
                 "It stores shapes, not pixels."),
                ("Why does video compress so well?", "Consecutive frames are similar",
                 "Only the differences need storing, plus periodic key frames."),
                ("Codec or container: MP4?", "Container",
                 "It holds streams; H.264 is a codec commonly inside one."),
                ("Lossy compression for a spreadsheet?", "Never",
                 "The content must be recovered exactly."),
            ]),
        ]),
    ],
    key_terms=[
        ("Sampling rate", "How many times per second an analogue signal is measured."),
        ("Bit depth", "Bits used per sample or per pixel; more means finer gradation."),
        ("Codec", "The method used to compress and decompress a media stream."),
        ("Container", "A file format holding streams together with sync information."),
        ("Streaming", "Playing media as it arrives rather than after it downloads."),
        ("Key frame", "A complete frame letting playback start or recover mid-stream."),
    ],
    summary=(
        "Media is digitised by sampling and quantising, with rate and depth fixing both "
        "fidelity and size, which can be calculated directly. Raster images suit "
        "photographs and vectors suit anything that must scale. Lossy compression is "
        "acceptable for perceptual media and never for documents or programs. A codec "
        "compresses a stream while a container holds streams together, and streaming "
        "plays as data arrives rather than after it completes."
    ),
    exam_notes=[
        desc(
            "File-size arithmetic appears often. Remember to convert bits to bytes by "
            "dividing by eight, and check whether the question defines a megabyte as "
            "1,000 or 1,024 kilobytes."
        ),
        ul([
            "Vector scales losslessly; raster does not.",
            "MP4 is a container, H.264 a codec.",
            "Streaming starts sooner; downloading works offline afterwards.",
        ]),
    ],
)


LESSONS[751] = lesson_structure(
    name="Multimedia application",
    intro=(
        "This lesson covers what multimedia is used for: computer graphics, animation, "
        "virtual and augmented reality, and the ways media is applied in education, "
        "business and entertainment -- together with the practical constraints each "
        "brings."
    ),
    objectives=[
        "Describe how 3D graphics are produced.",
        "Distinguish virtual from augmented reality.",
        "Describe applications of multimedia in business and education.",
        "Explain what digital rights management addresses.",
        "Describe the accessibility obligations that come with media.",
        "Explain what affects streaming quality.",
    ],
    minutes=30,
    sections=[
        ("Computer graphics", [
            desc(
                "Three-dimensional graphics build a scene from geometry, apply surface "
                "properties and lighting, then render it to a two-dimensional image."
            ),
            ol([
                "Modelling -- define the shapes as meshes of points and faces.",
                "Texturing -- apply surface images and material properties.",
                "Lighting -- place light sources and define how surfaces respond.",
                "Rendering -- calculate the final image from a viewpoint.",
            ]),
            desc(
                "Rendering is arithmetic on a vast scale, which is why it runs on a GPU: "
                "many simple calculations that can all happen at once."
            ),
        ]),
        ("Animation", [
            desc(
                "Animation presents images fast enough for the eye to read motion, "
                "typically 24 to 60 frames a second. Below about 12 the illusion breaks "
                "and the result is a slideshow."
            ),
            ul([
                "Frame-by-frame -- each image drawn individually.",
                "Keyframe and tweening -- the positions at start and end are defined and the computer fills between them.",
                "Motion capture -- recorded human movement drives a model.",
                "Procedural -- motion generated by rules, as for crowds or water.",
            ]),
        ]),
        ("Virtual and augmented reality", [
            compare_grid(
                "Two different propositions",
                "The distinction is whether the real world remains visible.",
                [("Virtual reality (VR)",
                  "Replaces what you see with a generated environment, usually through a "
                  "headset. Immersive; isolating; sensitive to latency, which causes "
                  "discomfort."),
                 ("Augmented reality (AR)",
                  "Overlays information on the real world, often through a phone camera. "
                  "Keeps context, so it suits maintenance, navigation and retail.")],
            ),
            desc(
                "Mixed reality goes further, anchoring virtual objects to real surfaces "
                "so they stay in place as the viewer moves."
            ),
        ]),
        ("Where multimedia is applied", [
            accordion([
                ("Education and training", "Simulation lets dangerous or expensive procedures be practised safely and repeatedly."),
                ("Marketing", "Video and interactive content carry more in less time than text, and are measured by engagement."),
                ("Design and manufacturing", "CAD models are visualised and tested before anything is built."),
                ("Medicine", "Imaging and 3D reconstruction support diagnosis and surgical planning."),
                ("Entertainment", "Games, film and streaming -- the largest driver of both codec and GPU development."),
            ]),
        ]),
        ("Delivering media well", [
            desc(
                "Media is heavy, and delivering it badly undoes the benefit of producing "
                "it."
            ),
            ul([
                "Compress appropriately for the medium and audience.",
                "Serve images at the size they will be displayed, not the size they were made.",
                "Use adaptive streaming so quality degrades instead of playback stopping.",
                "Place content near the audience -- a content delivery network exists for this.",
            ]),
        ]),
        ("Rights and accessibility", [
            desc(
                "Media carries obligations in both directions: respecting the rights in "
                "material you use, and making what you publish usable by everyone."
            ),
            ul([
                "Images, music and video are copyrighted; a licence is needed to use them.",
                "Digital rights management restricts copying, at some cost to legitimate use.",
                "Captions and transcripts are required for video in most accessibility standards.",
                "Alt text is required for informative images.",
                "Avoid rapidly flashing content, which can trigger seizures.",
            ]),
        ]),
        ("Recall practice", [
            desc("Answer before turning each card."),
            flip_cards([
                ("VR or AR: the real world stays visible?", "AR",
                 "VR replaces what you see entirely."),
                ("What is tweening?", "Filling frames between keyframes",
                 "The animator defines start and end; the computer generates between."),
                ("Why does rendering use a GPU?", "Many simple parallel calculations",
                 "That is exactly what a GPU is built for."),
                ("What must accompany published video?", "Captions",
                 "Required by most accessibility standards, and useful to everyone."),
            ]),
        ]),
    ],
    key_terms=[
        ("Rendering", "Calculating a 2D image from a 3D scene and viewpoint."),
        ("Keyframe", "A defined position between which intermediate frames are generated."),
        ("Virtual reality", "A generated environment replacing what the user sees."),
        ("Augmented reality", "Information overlaid on the real world."),
        ("DRM", "Technical restrictions on copying or using licensed media."),
        ("CDN", "Servers distributed geographically so content is delivered from nearby."),
    ],
    summary=(
        "Three-dimensional graphics proceed from modelling through texturing and "
        "lighting to rendering, which suits a GPU because it is massively parallel "
        "arithmetic. Animation relies on enough frames per second for the eye to read "
        "motion, generated frame by frame or between keyframes. VR replaces the visible "
        "world while AR overlays it, and both are latency-sensitive. Delivering media "
        "well means compressing appropriately and serving from nearby, and publishing "
        "it brings copyright and accessibility obligations."
    ),
    exam_notes=[
        desc(
            "The VR-versus-AR distinction is examined directly. So is the fact that "
            "media found online is copyrighted by default and needs a licence."
        ),
        ul([
            "AR overlays; VR replaces.",
            "Rendering is GPU work because it parallelises.",
            "Captions and alt text are accessibility requirements, not extras.",
        ]),
    ],
)

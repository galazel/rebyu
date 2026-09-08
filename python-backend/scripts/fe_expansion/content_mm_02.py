"""Technology Element -> Multimedia, lesson 2: multimedia application.

Syllabus minor category 2. Shorter than its partner in the 2016 document --
eleven lines -- and examined mainly by identification, so the emphasis here is
on the distinctions the paper actually draws: raster against vector, the
graphics pipeline's stages, and where each application of multimedia sits.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, media_text, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Technology Element"
MIDDLE = "Multimedia"

_ma_sections = [
    ("Where Multimedia Is Actually Used", [
        desc(
            "The previous lesson was about representing media. This one is "
            "about what is built with it, and the applications divide by what "
            "the media is FOR rather than by what technology produces it."
        ),
        table(
            ["Application", "What the media does", "The constraint that "
                                                   "dominates"],
            [["Web and mobile content", "Informs and persuades",
              "Bandwidth and load time"],
             ["Training and e-learning", "Explains and demonstrates",
              "Comprehension, and accessibility"],
             ["Simulation", "Reproduces a situation for practice",
              "Fidelity, and real-time response"],
             ["Games and entertainment", "Engages", "Frame rate, which is "
                                                    "non-negotiable"],
             ["Visualisation", "Reveals structure in data",
              "Honesty -- the picture must not mislead"],
             ["Digital signage and kiosks", "Reaches a passing audience",
              "Legibility at distance, and unattended reliability"]],
            caption="Six applications and what governs each.",
            footer="Read the right-hand column. The same video technology "
                   "serves all six, and what makes a design succeed differs "
                   "completely between them."),
        desc(
            "The examination frames items around that third column. Asked "
            "which format, resolution or delivery method suits a described "
            "application, the answer follows from the dominant constraint -- "
            "so identifying it is most of the work, and the technology "
            "choices then follow almost mechanically."
        ),
    ]),

    ("Raster and Vector Graphics", [
        desc(
            "Two fundamentally different ways of describing a picture, and "
            "the choice is decided by what the picture IS rather than by how "
            "it will be used."
        ),
        image(fig("raster-vs-vector")),
        desc(
            "A RASTER image is a grid of pixels, each with a colour. It can "
            "represent anything, including a photograph, and its size is "
            "fixed at capture -- so enlarging it interpolates between the "
            "pixels that exist rather than revealing detail that does not. "
            "Its file size depends on dimensions and colour depth and is "
            "indifferent to what the image shows."
        ),
        desc(
            "A VECTOR image is a description of shapes: lines, curves, fills "
            "and text. It scales to any size without loss because it is "
            "redrawn rather than stretched, and its file size depends on how "
            "many shapes it contains rather than how large it is displayed. "
            "It cannot represent a photograph, which has no shapes to "
            "describe."
        ),
        desc(
            "The size behaviour running in opposite directions is the "
            "discriminating property, and it settles most examination items. "
            "A logo is tiny as a vector at any size and large as a raster at "
            "a big one; a photograph is ordinary as a raster and impossible "
            "as a vector. RASTERISATION converts vector to raster and happens "
            "whenever a vector image is displayed or printed, which is why "
            "the output resolution is chosen at that moment rather than at "
            "authoring."
        ),
    ]),

    ("Two-Dimensional Graphics Operations", [
        desc(
            "The operations applied to a two-dimensional image are named in "
            "the syllabus, and they divide into those that move pixels and "
            "those that change their values."
        ),
        table(
            ["Operation", "Does", "Note"],
            [["Translation", "Moves the image", "No pixel values change"],
             ["Rotation and scaling", "Turns or resizes it",
              "Requires interpolation, so quality degrades"],
             ["Clipping", "Discards what falls outside a region",
              "Nothing is altered, only omitted"],
             ["Filtering", "Alters pixel values -- blur, sharpen, edge "
                           "detect",
              "Each pixel computed from its neighbours"],
             ["Alpha compositing", "Combines images using transparency",
              "The alpha channel stores per-pixel opacity"],
             ["Anti-aliasing", "Smooths the stair-stepping on diagonal edges",
              "Blends edge pixels, trading sharpness for smoothness"]],
            caption="Six operations, and what each actually does to the "
                    "pixels.",
            footer="Anti-aliasing is the one worth understanding rather than "
                   "memorising. A diagonal line on a pixel grid can only be "
                   "approximated by squares, and blending the edge pixels "
                   "makes the approximation less visible to the eye."),
        desc(
            "The second row carries a consequence people meet constantly. "
            "Rotating or scaling a raster image requires computing pixel "
            "values that were never captured, so it is inherently lossy -- "
            "and repeating the operation compounds the degradation, exactly "
            "as repeated lossy saves do. A vector image suffers neither, "
            "because it is redrawn from the shape description each time."
        ),
    ]),

    ("The Three-Dimensional Graphics Pipeline", [
        desc(
            "Producing a two-dimensional image of a three-dimensional scene "
            "runs through a defined sequence of stages, and the examination "
            "expects them in order."
        ),
        image(fig("graphics-pipeline")),
        ol([
            "MODELLING defines objects as meshes of vertices and the surfaces "
            "between them, in each object's own coordinate space.",
            "TRANSFORMATION positions, rotates and scales each object into a "
            "shared world space, and then into a space relative to the "
            "viewpoint.",
            "PROJECTION maps three dimensions onto the two of the image "
            "plane, which is where perspective is introduced.",
            "CLIPPING and HIDDEN SURFACE REMOVAL discard what falls outside "
            "the view or behind something else, so nothing invisible is "
            "drawn.",
            "RASTERISATION converts the remaining shapes into pixels.",
            "SHADING computes each pixel's colour from lighting, material and "
            "texture.",
        ]),
        desc(
            "The workload is enormous and highly parallel: the same operation "
            "applied to millions of independent vertices and pixels, sixty "
            "times a second. That shape -- many identical operations on "
            "independent data -- is exactly the SIMD parallelism of the "
            "Processor lesson, and it is why graphics processors exist as "
            "separate devices rather than as a faster general processor."
        ),
    ]),

    ("Rendering, Lighting and Texture", [
        desc(
            "The shading stage is where an image stops looking like coloured "
            "polygons, and the syllabus names its main techniques."
        ),
        content_accordion(
            "WHAT MAKES A RENDERED IMAGE CONVINCING",
            "Each technique addresses one way a naive rendering looks wrong.",
            [("Texture mapping",
              "Wrapping an image onto a surface, so detail comes from a "
              "picture rather than from geometry. Vastly cheaper than "
              "modelling the detail as shapes, and it is why a brick wall is "
              "one flat rectangle."),
             ("Lighting models",
              "Computing how surfaces respond to light sources -- ambient "
              "light everywhere, diffuse light scattered by matte surfaces, "
              "specular highlights on shiny ones. Together they give shape to "
              "something that would otherwise read as a flat silhouette."),
             ("Shadows",
              "Determining what is blocked from each light. Expensive, and "
              "the single strongest cue for where an object sits relative to "
              "a surface -- an unshadowed object appears to float."),
             ("Ray tracing",
              "Following light paths to compute reflection, refraction and "
              "shadow physically rather than approximating them. Far more "
              "realistic and far more expensive, which is why it arrived in "
              "film long before it arrived in real time."),
             ("Level of detail",
              "Using simpler models for distant objects, since the detail "
              "would occupy few pixels anyway. A pure optimisation, and one "
              "of the most effective available.")]),
        desc(
            "The recurring trade is realism against frame time, and it is a "
            "hard constraint rather than a preference. At sixty frames per "
            "second there are under seventeen milliseconds to produce an "
            "entire frame, so every technique is judged by what it costs "
            "within that budget -- which is why film rendering, with hours "
            "per frame, and real-time rendering look different."
        ),
    ]),

    ("Animation", [
        desc(
            "Animation is a sequence of images shown fast enough that the eye "
            "reads motion, and the syllabus distinguishes how the sequence is "
            "produced."
        ),
        compare_grid(
            "TWO WAYS TO PRODUCE THE FRAMES",
            "The distinction is whether every frame is authored or most are "
            "computed.",
            [("Frame by frame",
              "Each image drawn or captured individually. Total control, and "
              "the cost scales with the number of frames -- which at 24 or "
              "more per second is considerable."),
             ("Keyframe and interpolation",
              "Significant positions are authored as keyframes and the frames "
              "between them are computed -- tweening. Far less work, and the "
              "interpolation must be shaped so motion accelerates and "
              "decelerates rather than moving mechanically.")]),
        desc(
            "FRAME RATE is where perception sets the requirement. Around 24 "
            "frames per second is enough for motion to read as continuous, "
            "which is why film settled there; interactive content generally "
            "targets 60, because the user is also providing input and delay "
            "between action and response is felt separately from smoothness."
        ),
        desc(
            "The syllabus also names MORPHING, a gradual transformation of "
            "one image into another, and MOTION CAPTURE, recording a real "
            "performer's movement and applying it to a model. Both are ways "
            "of obtaining plausible motion without animating every frame by "
            "judgement, which is the recurring problem animation solves."
        ),
    ]),

    ("Virtual and Augmented Reality", [
        desc(
            "Two related technologies the syllabus names, and the distinction "
            "between them is examined directly."
        ),
        table(
            ["", "Virtual reality", "Augmented reality"],
            [["What the user sees", "A wholly synthetic environment",
              "The real world with information added"],
             ["Awareness of surroundings", "Replaced entirely",
              "Retained"],
             ["Registration problem", "None -- there is nothing to align to",
              "Central: the overlay must track the real scene"],
             ["Typical use", "Training, simulation, immersive experience",
              "Maintenance guidance, navigation, retail"],
             ["Hardware", "An enclosing headset", "A phone, glasses or a "
                                                  "visor"]],
            caption="Two technologies, and the row that separates them.",
            footer="MIXED REALITY is the term for systems in which virtual "
                   "objects interact with real ones -- occluded by real "
                   "surfaces, resting on real tables -- which requires "
                   "understanding the geometry of the real scene rather than "
                   "merely drawing over it."),
        desc(
            "LATENCY is the constraint that dominates virtual reality and is "
            "worth knowing as a specific figure. The image must respond to "
            "head movement within roughly twenty milliseconds; beyond that, "
            "the mismatch between what the inner ear reports and what the "
            "eyes see produces genuine nausea. It is a hard real-time "
            "requirement in the sense the Basic Theory lesson defined, and it "
            "constrains the whole system rather than only the display."
        ),
    ]),

    ("Authoring and Production", [
        desc(
            "Producing multimedia content is a process with a recognisable "
            "shape, and the syllabus expects awareness of the stages and "
            "their costs."
        ),
        ol([
            "PLANNING: what the content is for, who it addresses, and what it "
            "must achieve. Skipping this produces material that is "
            "well-made and unusable.",
            "SCRIPTING and STORYBOARDING: the sequence and structure decided "
            "cheaply, before anything expensive is produced.",
            "ASSET PRODUCTION: capturing or creating the media -- filming, "
            "recording, illustrating, modelling.",
            "AUTHORING: assembling assets into the finished piece, with "
            "navigation and interaction.",
            "TESTING: with representative users and on the target devices, "
            "which is where most problems are found.",
            "DELIVERY and MAINTENANCE: publishing, and updating it as the "
            "content goes out of date.",
        ]),
        desc(
            "The storyboard stage is the one worth emphasising because it is "
            "the same argument the Human Interface lesson made about "
            "prototypes. Restructuring a storyboard costs an afternoon; "
            "restructuring after filming costs the filming again. The "
            "cheapest artefact that can settle a question should be the one "
            "used to settle it."
        ),
        desc(
            "ASSET MANAGEMENT becomes the dominant practical problem as a "
            "library grows. Source files, versions, licences and derived "
            "renditions all multiply, and without a naming and cataloguing "
            "discipline from the start, the cost of finding an existing asset "
            "exceeds the cost of producing it again -- which is how "
            "organisations end up with eleven slightly different versions of "
            "one logo."
        ),
    ]),

    ("Hypermedia and Interactive Content", [
        desc(
            "HYPERMEDIA is media with navigable links between its parts. The "
            "web is the obvious instance, and the idea is older and broader "
            "than the web."
        ),
        compare_grid(
            "LINEAR AND NON-LINEAR CONTENT",
            "The distinction is who decides the order.",
            [("Linear",
              "A fixed sequence the author chose -- a film, a recorded "
              "lecture. The author controls pacing and can build an argument, "
              "and the reader cannot skip to what they need."),
             ("Non-linear (hypermedia)",
              "The reader chooses a path through linked material. Suits "
              "reference and exploration, and it means the author cannot "
              "assume what has been read already -- so each part must stand "
              "alone more than a chapter would.")]),
        desc(
            "That last point is the practical consequence and it is easy to "
            "miss. Writing for a non-linear medium means every page may be "
            "someone's first, so context that a linear document would "
            "establish once must be available from anywhere -- which is why "
            "good reference material repeats itself in ways a book would not."
        ),
        desc(
            "INTERACTIVITY adds response: the content changes according to "
            "what the user does. The syllabus's interest is in the design "
            "consequence rather than the technique -- interactive content "
            "must handle every path a user might take, so its testing burden "
            "grows with the number of choices rather than with its length."
        ),
    ]),

    ("Media Search and Recognition", [
        desc(
            "The previous lesson established that media cannot be searched by "
            "its content the way text can. Automated analysis is what "
            "narrows that gap, and the syllabus expects the categories."
        ),
        table(
            ["Technique", "Produces", "Reliability"],
            [["Speech recognition", "A transcript of spoken audio",
              "Good for clear speech, poor with noise and accents"],
             ["Optical character recognition", "Text from images of text",
              "Good on printed text, weak on handwriting"],
             ["Image classification", "Labels for objects and scenes",
              "Confident and sometimes confidently wrong"],
             ["Face recognition", "Identity matches",
              "Accurate under good conditions, and legally sensitive"],
             ["Content-based retrieval", "Similar images or audio",
              "Finds resemblance rather than meaning"]],
            caption="Five techniques for making media searchable.",
            footer="Every row produces INFERENCE rather than fact. The "
                   "metadata is a probabilistic guess, so a search over it "
                   "returns approximately the right results and occasionally "
                   "something unrelated."),
        desc(
            "The fourth row carries obligations beyond the technical. "
            "Biometric data is treated as a special category under most "
            "privacy regimes, so face recognition over stored media brings "
            "consent, retention and purpose-limitation requirements that the "
            "Legal Affairs lessons treat properly -- and those apply whether "
            "or not anyone intended to build a recognition system."
        ),
    ]),

    ("Accessible Media", [
        desc(
            "The Human Interface lesson established accessibility as a "
            "requirement. Media has its own specific obligations, because the "
            "content is inherently sensory."
        ),
        table(
            ["Provision", "Serves", "Also helps"],
            [["Captions", "Deaf and hard of hearing viewers",
              "Anyone in a noisy or silent environment"],
             ["Transcripts", "Screen reader users",
              "Anyone who would rather scan than watch, and search engines"],
             ["Audio description", "Blind and low-vision viewers",
              "Anyone listening without watching"],
             ["Sign language interpretation", "Users whose first language is "
                                              "a signed one",
              "Nobody else, and it is not optional for those it serves"],
             ["Controls for playback speed and volume",
              "Cognitive and hearing differences", "Almost everyone"]],
            caption="Five provisions, and who each one is for.",
            footer="The third column is the recurring argument. Most "
                   "accessibility provisions serve a far wider population "
                   "than the one that requires them, which is why they are "
                   "rarely a cost with no return."),
        desc(
            "One distinction the examination draws: captions are not "
            "subtitles. SUBTITLES assume the viewer can hear and renders "
            "dialogue in another language; CAPTIONS assume they cannot and "
            "include the non-speech sounds that carry meaning. Supplying "
            "subtitles where captions were required leaves out exactly the "
            "information the provision existed for."
        ),
    ]),

    ("Rights and Licensing of Media", [
        desc(
            "Media is protected by copyright from the moment it is created, "
            "and using someone else's without permission is infringement -- a "
            "point the Intellectual Property lesson develops and that belongs "
            "here because media is where it goes wrong most often."
        ),
        ul([
            "STOCK LICENCES grant specified uses -- often distinguishing "
            "editorial from commercial, and limiting print runs or audience "
            "size. Exceeding the licence is infringement even though the "
            "asset was paid for.",
            "CREATIVE COMMONS licences grant broad rights on stated "
            "conditions, typically attribution and sometimes non-commercial "
            "or share-alike terms. They are licences with obligations, not a "
            "public domain.",
            "MODEL and PROPERTY RELEASES are needed to use recognisable "
            "people or private property commercially, separately from "
            "copyright in the image itself.",
            "MUSIC carries at least two rights -- in the composition and in "
            "the recording -- so licensing one does not license the other.",
        ]),
        desc(
            "The practical failure is almost always the same: an asset found "
            "through a search is used because it was available, with no "
            "record of where it came from or what was permitted. Recording "
            "the source and licence at the point of acquisition costs "
            "seconds; establishing them afterwards, across a library of "
            "thousands, is effectively impossible."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where multimedia application items are lost."),
        ul([
            "Expecting a raster image to enlarge without loss. Only vectors "
            "do that.",
            "Choosing vector for a photograph. There are no shapes in one to "
            "describe.",
            "Repeatedly rotating or scaling a raster image, which compounds "
            "interpolation loss.",
            "Confusing virtual with augmented reality. Augmented retains the "
            "real world and must register to it.",
            "Overlooking that virtual reality has a hard latency requirement "
            "of roughly twenty milliseconds.",
            "Treating automated media labels as fact rather than inference.",
            "Supplying subtitles where captions were required.",
            "Using a licensed asset beyond what its licence permits, or "
            "recording no licence at all.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A company logo must appear on a business card, on a website "
            "banner, and on a vehicle two metres wide. Which format should "
            "the master be held in, and why?\""
        ),
        ol([
            "Identify what varies: the same image is required at wildly "
            "different physical sizes.",
            "Consider raster. A single file would have to be large enough for "
            "the vehicle, making it enormous and wasteful for the card -- and "
            "any file sized for the card cannot be enlarged, because the "
            "detail was never captured.",
            "Consider vector. It is a description of shapes, so it is "
            "redrawn at whatever size is required, with no loss and no "
            "size penalty.",
            "The logo is line art -- shapes and text -- so it is expressible "
            "as a vector, unlike a photograph.",
            "Answer: hold the master as a vector, and export raster "
            "renditions at whatever specific sizes each medium needs.",
        ]),
        desc(
            "The general pattern is the one to take away, and it recurs "
            "throughout production work: keep the master in the most "
            "capable, least lossy form, and derive delivery copies from it. "
            "It is the same principle as keeping a lossless audio master, and "
            "as building an artifact once and promoting it."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Multimedia applications reach into several later majors."),
        ul([
            "The graphics pipeline's parallelism is the SIMD workload of the "
            "Processor lesson, and the reason GPUs exist.",
            "Virtual reality's latency requirement is hard real-time from "
            "Measurement and Control.",
            "Captions and audio description are the accessibility "
            "requirements of Human Interface.",
            "Licensing is copyright, developed in Intellectual Property "
            "Rights.",
            "Face recognition brings the biometric data obligations of Laws "
            "on Security.",
            "Asset management is a configuration management problem in "
            "everything but name.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("Raster against vector",
              "Pixels against shapes",
              "Raster size follows dimensions and cannot enlarge; vector size "
              "follows complexity and scales freely. A photograph can only be "
              "raster."),
             ("The graphics pipeline in order",
              "Model, transform, project, rasterise, shade",
              "Highly parallel throughout, which is what a GPU is built "
              "for."),
             ("Keyframe animation",
              "Author the significant frames, compute the rest",
              "Tweening. The interpolation must accelerate and decelerate or "
              "the motion reads as mechanical."),
             ("Virtual against augmented reality",
              "Replaces the world against adds to it",
              "Augmented must REGISTER its overlay to the real scene, which "
              "virtual reality never has to solve."),
             ("The VR latency requirement",
              "About 20 milliseconds",
              "Beyond that, the mismatch between inner ear and eyes causes "
              "nausea. A hard real-time constraint."),
             ("Captions against subtitles",
              "Assume the viewer cannot hear against can",
              "Captions include non-speech sounds that carry meaning; "
              "subtitles render dialogue in another language.")]),
    ]),
]

_ma_quiz = [
    mcq("AVERAGE",
        "A company logo must be reproduced on a business card and also on a "
        "vehicle two metres wide.\n\n"
        "In which format should the master be held?",
        [("A high-resolution raster image sized for the vehicle", False),
         ("A vector image, exported to raster at each required size", True),
         ("Separate raster images produced at each required size", False),
         ("A lossless raster image at the business card's resolution", False)],
        "A vector image describes shapes rather than pixels, so it is redrawn "
        "at whatever size is needed with no loss and no size penalty -- and a "
        "logo is line art, which is expressible as shapes. A raster master "
        "sized for the vehicle is enormous and wasteful for the card, one "
        "sized for the card cannot be enlarged because the detail was never "
        "captured, and maintaining separate files means every future change "
        "must be repeated in each."),

    mcq("EASY",
        "Which characteristic distinguishes augmented reality from virtual "
        "reality?",
        [("Augmented reality requires more processing power", False),
         ("Augmented reality retains the real world and adds to it", True),
         ("Augmented reality is viewed without any hardware", False),
         ("Augmented reality uses vector rather than raster graphics", False)],
        "Virtual reality replaces the user's surroundings with a synthetic "
        "environment; augmented reality retains the real world and overlays "
        "information on it -- which creates the registration problem virtual "
        "reality never faces, since the overlay must track the real scene "
        "accurately as the viewpoint moves. Both require hardware, and the "
        "graphics representation is unrelated to the distinction."),

    mcq("HARD",
        "Virtual reality systems are designed to respond to head movement "
        "within approximately twenty milliseconds.\n\n"
        "Why is this a hard requirement rather than a quality target?",
        [("Longer delays make the frame rate visibly uneven", False),
         ("The mismatch between inner ear and vision induces nausea", True),
         ("Headset displays cannot buffer more than twenty milliseconds",
          False),
         ("Network protocols time out beyond twenty milliseconds", False)],
        "When the head turns and the image does not follow promptly, the "
        "balance system reports motion that vision contradicts, and the "
        "resulting conflict produces genuine physical sickness rather than "
        "mere dissatisfaction. That makes it a hard real-time deadline in the "
        "sense the Basic Theory lesson defined -- judged on the worst case, "
        "not the average -- and it constrains the whole system rather than "
        "only the display."),

    mcq("AVERAGE",
        "In keyframe animation, what happens between the authored frames?",
        [("They are captured individually by a motion capture rig", False),
         ("Intermediate frames are computed by interpolation", True),
         ("The previous keyframe is repeated until the next", False),
         ("The renderer omits them and the frame rate drops", False)],
        "Keyframes record the significant positions and the frames between "
        "them are computed -- tweening -- which is what makes animation "
        "affordable at 24 or more frames per second. The interpolation must "
        "be shaped so motion accelerates and decelerates, since a purely "
        "linear tween reads as mechanical. Motion capture is a separate "
        "technique for obtaining movement from a real performer."),

    mcq("AVERAGE",
        "Which stage of the 3D graphics pipeline converts geometric shapes "
        "into pixels?",
        [("Transformation", False),
         ("Rasterisation", True),
         ("Projection", False),
         ("Shading", False)],
        "Rasterisation is the conversion from shapes to the pixel grid, and "
        "it sits after projection has reduced three dimensions to two. "
        "Transformation positions objects, projection maps the scene onto the "
        "image plane and introduces perspective, and shading computes each "
        "pixel's colour once the pixels exist. The order is the sequence the "
        "examination asks for."),

    mcq("HARD",
        "A raster photograph is rotated by fifteen degrees, saved, and later "
        "rotated back by fifteen degrees.\n\n"
        "What is the result?",
        [("The original image, since the rotations cancel exactly", False),
         ("A degraded image, because each rotation interpolates pixel "
          "values", True),
         ("An image of different dimensions but identical quality", False),
         ("An image that cannot be displayed without re-rasterisation",
          False)],
        "Rotating a raster image requires computing pixel values at positions "
        "that were never sampled, so each rotation interpolates and loses "
        "accuracy -- and rotating back interpolates again rather than "
        "reversing the first operation. The degradation compounds exactly as "
        "repeated lossy saves do. A vector image suffers neither, because it "
        "is redrawn from the shape description each time."),

    mcq("EASY",
        "What distinguishes captions from subtitles?",
        [("Captions appear at the top of the frame and subtitles at the "
          "bottom", False),
         ("Captions assume the viewer cannot hear and include non-speech "
          "sounds", True),
         ("Captions are generated automatically and subtitles are written by "
          "hand", False),
         ("Captions are required by law and subtitles are always "
          "optional", False)],
        "Subtitles assume the viewer can hear and render dialogue, typically "
        "in another language. Captions assume they cannot and therefore "
        "include the non-speech sounds that carry meaning -- a door closing, "
        "a phone ringing, music becoming ominous. Supplying subtitles where "
        "captions were required omits exactly the information the provision "
        "existed to supply. Position and production method are unrelated to "
        "the distinction."),

    mcq("AVERAGE",
        "An image classification service labels a stored video's contents "
        "automatically.\n\n"
        "How should these labels be treated?",
        [("As authoritative metadata equivalent to manual cataloguing",
          False),
         ("As probabilistic inference that is sometimes wrong", True),
         ("As lossless derivations from the video's own content", False),
         ("As a replacement for descriptive metadata at ingest", False)],
        "Automated analysis produces a confident guess rather than a fact, so "
        "a search over such labels returns approximately the right results "
        "and occasionally something unrelated. That is usable and worth "
        "having, particularly across an archive too large to catalogue by "
        "hand -- and treating it as authoritative is the error, because the "
        "confidence attached to a label says nothing about whether it is "
        "correct."),

    mcq("HARD",
        "A stock photograph is licensed for editorial use and appears in a "
        "product advertisement.\n\n"
        "What is the position?",
        [("Acceptable, since the asset was purchased", False),
         ("Infringement, because the use exceeds what the licence "
          "permits", True),
         ("Acceptable, provided the photographer is credited", False),
         ("Infringement only if the photograph shows identifiable "
          "people", False)],
        "A licence grants specified uses, and paying for it does not grant "
        "any others -- an editorial licence typically excludes commercial and "
        "advertising use precisely because that use is worth more. Exceeding "
        "the licence is infringement despite the asset having been bought "
        "legitimately. Attribution satisfies a different condition where one "
        "exists, and a model release for identifiable people is a further "
        "requirement rather than the one at issue here."),

    mcq("AVERAGE",
        "Why is the 3D graphics pipeline well suited to a graphics processor "
        "rather than a general-purpose one?",
        [("It requires higher clock frequencies than a CPU can reach", False),
         ("It applies the same operations to millions of independent "
          "items", True),
         ("It cannot be expressed in a general-purpose programming "
          "language", False),
         ("It requires floating-point arithmetic that CPUs do not "
          "support", False)],
        "Every stage performs the same operation across vast numbers of "
        "vertices or pixels that do not depend on one another, which is "
        "exactly the data-level parallelism a GPU's many simple cores "
        "exploit and a general processor's few complex cores cannot. GPUs run "
        "at LOWER clock rates than CPUs, general processors handle "
        "floating-point perfectly well, and the pipeline is entirely "
        "expressible in ordinary code -- just far more slowly."),
]

LESSON_MM_APP = lesson(
    MAJOR, MIDDLE,
    "Multimedia Applications: Graphics, Audio, Video and VR",
    _ma_quiz,
    lesson_structure(
        "Multimedia Applications: Graphics, Audio, Video and VR",
        "The previous lesson was about representing media; this one is about "
        "what is built with it. It separates raster from vector by the "
        "property that decides between them -- their file sizes depend on "
        "opposite things -- works through the graphics pipeline and why its "
        "shape produced a separate class of processor, covers animation, "
        "virtual and augmented reality with the latency requirement that "
        "makes one of them a hard real-time problem, and closes on the "
        "practical obligations that surround media in an organisation: "
        "accessibility, automated cataloguing that infers rather than knows, "
        "and licences that are exceeded far more often than they are read.",
        [
            "Identify the dominant constraint for a described multimedia "
            "application",
            "Distinguish raster from vector by how each one's size behaves",
            "Name the 2D operations and identify which degrade an image",
            "State the graphics pipeline stages in order and explain the GPU's "
            "suitability",
            "Distinguish frame-by-frame from keyframe animation",
            "Distinguish virtual, augmented and mixed reality and state the "
            "VR latency requirement",
            "Identify accessibility provisions for media and distinguish "
            "captions from subtitles",
            "Recognise a licence breach in a described use of an asset",
        ],
        60,
        _ma_sections,
        [
            ("Raster image",
             "A grid of coloured pixels. Can represent anything; its size "
             "follows dimensions and colour depth, and enlarging it "
             "interpolates rather than revealing detail."),
            ("Vector image",
             "A description of shapes. Scales to any size without loss and "
             "its size follows complexity, and it cannot represent a "
             "photograph."),
            ("Rasterisation",
             "Converting a vector description into pixels, which happens "
             "whenever a vector image is displayed or printed."),
            ("Anti-aliasing",
             "Blending edge pixels to reduce the stair-stepping of diagonal "
             "lines on a pixel grid."),
            ("Alpha channel",
             "Per-pixel opacity, allowing images to be composited over one "
             "another."),
            ("Graphics pipeline",
             "Model, transform, project, clip, rasterise, shade. Highly "
             "parallel throughout, which is why GPUs exist."),
            ("Texture mapping",
             "Wrapping an image onto a surface so detail comes from a picture "
             "rather than from geometry."),
            ("Ray tracing",
             "Computing light paths physically for reflection, refraction and "
             "shadow. Far more realistic and far more expensive."),
            ("Keyframe animation",
             "Authoring significant frames and computing the frames between "
             "them by interpolation -- tweening."),
            ("Virtual reality",
             "A wholly synthetic environment replacing the user's "
             "surroundings. Requires response to head movement within about "
             "20 milliseconds to avoid nausea."),
            ("Augmented reality",
             "Information overlaid on the real world, which must be "
             "registered to the real scene as the viewpoint moves."),
            ("Hypermedia",
             "Media with navigable links between its parts, so the reader "
             "rather than the author chooses the path -- which means each "
             "part must stand alone."),
            ("Captions",
             "Text assuming the viewer cannot hear, including non-speech "
             "sounds that carry meaning. Distinct from subtitles, which "
             "assume they can."),
            ("Audio description",
             "Narration of visual content for blind and low-vision viewers."),
        ],
        "Multimedia applications divide by what the media is for, and the "
        "constraint that dominates each one -- bandwidth, comprehension, "
        "fidelity, frame rate, honesty -- is what the examination's items "
        "actually turn on. Raster and vector describe pictures in "
        "fundamentally different ways, and the discriminating property is "
        "that their sizes depend on opposite things: a raster's on its "
        "dimensions, a vector's on its complexity. So a logo is tiny as a "
        "vector at any size and a photograph is impossible as one, and the "
        "production rule follows -- keep the master in the most capable form "
        "and derive delivery copies from it. The graphics pipeline runs from "
        "modelling through transformation, projection, rasterisation and "
        "shading, applying identical operations to millions of independent "
        "items sixty times a second, which is precisely the parallelism a GPU "
        "exists for. Animation authors keyframes and computes the rest. "
        "Virtual reality replaces the world and augmented reality adds to it "
        "-- and only the second must register its overlay to a real scene, "
        "while only the first carries a twenty-millisecond deadline enforced "
        "by the inner ear. Around all of it sit obligations: accessibility "
        "provisions that serve far more people than they target, automated "
        "cataloguing that infers rather than knows, and licences that grant "
        "specified uses and are exceeded far more often than they are read.",
        exam_notes=[
            desc(
                "This category is examined by identification and by "
                "matching a technology to a described requirement."
            ),
            ul([
                "Choosing raster or vector for a described image and use.",
                "Naming a stage of the graphics pipeline.",
                "Distinguishing virtual from augmented reality.",
                "Explaining the VR latency requirement.",
                "Distinguishing captions from subtitles.",
                "Recognising a use that exceeds a licence.",
                "Explaining why repeated raster transformation degrades an "
                "image.",
            ]),
            desc(
                "For any format question, ask what the image IS before asking "
                "what it is for. Shapes and text can be vector and scale "
                "freely; captured continuous tone cannot be, whatever the "
                "requirement."
            ),
        ],
    ))

LESSONS = [LESSON_MM_APP]

"""Technology Element -> Multimedia, both lessons.

Syllabus minor categories 1 (multimedia technology) and 2 (multimedia
application).

The examinable core is arithmetic: file size from resolution, depth and
duration, and the compression ratio that follows. Everything else in the
category is identification. So the calculations are worked on specific
numbers, and the format tables are organised by the decision they support
rather than as lists to memorise.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, media_text, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Technology Element"
MIDDLE = "Multimedia"

# ==========================================================================
# Lesson 1: Multimedia technology
# ==========================================================================

_mt_sections = [
    ("What Makes Media Different", [
        desc(
            "Text is small, exact and easy to search. Sound, images and video "
            "are none of those things, and every technique in this lesson "
            "exists because of that difference."
        ),
        table(
            ["Property", "Text", "Media"],
            [["Size", "Kilobytes", "Megabytes to gigabytes"],
             ["Exactness", "Every character matters",
              "Small changes are imperceptible"],
             ["Searchability", "Directly searchable",
              "Only through metadata or analysis"],
             ["Timing", "None", "Audio and video must play at a fixed rate"],
             ["Compression", "Lossless, modest gains",
              "Lossy, very large gains"]],
            caption="Five differences, and each drives a design decision.",
            footer="The second row is the one that unlocks everything. "
                   "Because a small change to a photograph is invisible, media "
                   "can be compressed by discarding information -- which text "
                   "can never tolerate."),
        desc(
            "The fourth row explains why media is a systems problem rather "
            "than a storage one. A document arriving slowly is merely slow; "
            "audio arriving slowly stutters, and a video frame arriving after "
            "its moment is worthless. That real-time constraint is what "
            "streaming, buffering and codec design are all organised around."
        ),
    ]),

    ("Digitising Sound", [
        desc(
            "Sound is a continuous pressure wave, and the Theory of "
            "Information lesson's sampling and quantisation apply to it "
            "directly. Two parameters decide the result."
        ),
        table(
            ["Parameter", "Means", "Typical values", "Effect of raising it"],
            [["Sample rate", "Measurements per second",
              "44.1 kHz for CD, 48 kHz for video",
              "Captures higher frequencies"],
             ["Bit depth", "Bits per sample",
              "16 for CD, 24 for studio work",
              "Finer amplitude resolution, less quantisation noise"],
             ["Channels", "Independent audio streams", "1 mono, 2 stereo",
              "Multiplies the data proportionally"]],
            caption="Three parameters, and what each one buys.",
            footer="The sampling theorem sets the rate: human hearing reaches "
                   "about 20 kHz, so 44.1 kHz is a little above the required "
                   "twice that. It is not an arbitrary number."),
        ol([
            "Uncompressed audio size = sample rate x bit depth x channels x "
            "seconds, in bits.",
            "One minute of CD audio: 44,100 x 16 x 2 x 60 = 84,672,000 bits.",
            "Divide by 8 for bytes: 10,584,000 -- about 10.1 MiB per minute.",
            "So an hour is about 605 MiB, which is why a CD holds roughly "
            "74 minutes and why compression mattered so much for "
            "distribution.",
        ]),
    ]),

    ("Digitising Images", [
        desc(
            "An image is sampled into a grid of pixels, each quantised to a "
            "colour. The same two parameters appear under different names."
        ),
        ul([
            "RESOLUTION is the sampling density -- pixels across by pixels "
            "down, or dots per inch for print and scanning. Detail finer than "
            "the sampling interval is not captured, and no later processing "
            "recovers it.",
            "COLOUR DEPTH is the quantisation -- bits per pixel. One bit "
            "gives black and white, 8 bits give 256 levels or a palette, and "
            "24 bits give about 16.7 million colours at 8 bits per channel.",
            "A higher depth per CHANNEL matters most where the image will be "
            "processed afterwards, since each operation rounds and the spare "
            "bits absorb the accumulated error.",
        ]),
        ol([
            "Uncompressed image size = width x height x bytes per pixel.",
            "A 3,000 by 2,000 photograph at 24-bit colour: 3,000 x 2,000 x 3 "
            "= 18,000,000 bytes.",
            "That is about 17.2 MiB for one photograph, uncompressed.",
            "A typical JPEG of the same image occupies 2 to 3 MiB, which is a "
            "compression ratio of roughly 7:1 with no visible loss.",
        ]),
    ]),

    ("Colour Models", [
        desc(
            "How a colour is specified depends on whether the medium emits "
            "light or reflects it, which is why there is more than one model."
        ),
        image(fig("colour-models")),
        desc(
            "RGB is ADDITIVE and describes emitted light: red, green and blue "
            "combine, all three at full intensity give white, and none gives "
            "black because the display is off. It is the model for screens, "
            "cameras and scanners."
        ),
        desc(
            "CMY is SUBTRACTIVE and describes reflected light: each ink "
            "absorbs part of the spectrum, so more ink means darker. All "
            "three together should give black and in practice give a muddy "
            "brown, which is why printing adds a separate black -- the K in "
            "CMYK -- for both quality and cost."
        ),
        desc(
            "HSV, sometimes HSB, describes a colour as hue, saturation and "
            "value. It matches how people talk about colour rather than how "
            "devices produce it, which is why colour pickers use it and why "
            "it is converted to RGB or CMYK before anything is displayed or "
            "printed."
        ),
        desc(
            "The GAMUT is the set of colours a device can reproduce, and the "
            "gamuts of screens and printers do not coincide. This is the "
            "reason a vivid colour on screen may print dull: the printer "
            "cannot make it, so it substitutes the nearest colour it can -- "
            "and no amount of adjustment on the screen changes that."
        ),
    ]),

    ("Compression", [
        desc(
            "Uncompressed media is impractically large, and the two families "
            "of compression from the Theory of Information lesson divide "
            "cleanly by whether the original can be recovered."
        ),
        image(fig("compression-tradeoff")),
        table(
            ["", "Lossless", "Lossy"],
            [["Original recoverable", "Exactly, bit for bit", "No -- an "
                                                              "approximation"],
             ["Typical ratio", "2:1 to 4:1", "10:1 to 100:1"],
             ["Re-saving", "Harmless, however many times",
              "Damage accumulates with each save"],
             ["Editing", "Safe", "Each edit-and-save loses more"],
             ["Suits", "Text, code, diagrams, medical images",
              "Photographs, music, video for consumption"]],
            caption="The two families, compared on what actually decides "
                    "between them.",
            footer="GENERATION LOSS is the row that catches people: a JPEG "
                   "opened, cropped and re-saved a dozen times is visibly "
                   "worse than the original, because each save re-applies the "
                   "lossy step to an already-degraded image."),
        desc(
            "The COMPRESSION RATIO is original size divided by compressed "
            "size, so a 20 MB file reduced to 4 MB has a ratio of 5:1. The "
            "examination sometimes asks for the SAVING instead, which is the "
            "proportion removed -- 80% here -- and the two are easy to "
            "confuse under time pressure."
        ),
    ]),

    ("Image, Audio and Video Formats", [
        desc(
            "The formats the syllabus names are best held by the decision "
            "each one answers rather than as a list."
        ),
        content_accordion(
            "CHOOSING A FORMAT",
            "Each group has one question that decides it.",
            [("Photographs: JPEG",
              "Lossy, tuned for continuous-tone images where slight "
              "inaccuracy is invisible. Poor for sharp edges and flat colour "
              "-- text and diagrams saved as JPEG acquire visible artefacts "
              "around every line."),
             ("Diagrams, screenshots and transparency: PNG",
              "Lossless, with transparency support. Larger than JPEG on a "
              "photograph and far better on anything with sharp edges or "
              "flat areas of colour, which is exactly the case JPEG "
              "handles worst."),
             ("Illustrations and logos: SVG",
              "Vector rather than raster, so it scales to any size without "
              "loss and stays small. Unsuitable for photographic content, "
              "which has no shapes to describe."),
             ("Audio: MP3, AAC and FLAC",
              "MP3 and AAC are lossy and appropriate for listening; FLAC is "
              "lossless and appropriate for archiving and mastering. The "
              "choice is whether the file is a master or a delivery copy."),
             ("Video: MPEG family, H.264, H.265",
              "All lossy, and successive generations achieve the same quality "
              "at lower bit rates by spending more computation. That is the "
              "recurring video trade: better compression costs processing "
              "power at both ends.")]),
    ]),

    ("Codecs and Containers", [
        desc(
            "A distinction the examination draws and everyday language "
            "blurs: the CODEC decides how the media is compressed, and the "
            "CONTAINER decides how the compressed streams and their metadata "
            "are packaged together."
        ),
        image(fig("media-pipeline")),
        desc(
            "A single container format may hold any of several codecs, which "
            "is why a file with a recognised extension can still fail to "
            "play. The player recognises the container, opens it, and finds a "
            "codec it does not have -- so the error is not that the file is "
            "corrupt but that a piece of software is missing."
        ),
        desc(
            "A container also carries what a raw stream cannot: several audio "
            "tracks, subtitles, chapter marks, and the timing information "
            "that keeps audio and video synchronised. That synchronisation is "
            "the container's most important job, and it is why extracting a "
            "raw stream and reassembling it naively usually produces "
            "something that drifts."
        ),
    ]),

    ("How Video Compression Works", [
        desc(
            "Video compression achieves ratios far beyond still images, and "
            "the reason is worth understanding because it explains several "
            "behaviours the examination asks about."
        ),
        ul([
            "SPATIAL redundancy within a frame is removed as in a still "
            "image: neighbouring pixels resemble one another.",
            "TEMPORAL redundancy between frames is removed by storing only "
            "what CHANGED. Consecutive frames of a mostly static scene differ "
            "very little, and that difference is far smaller than a frame.",
            "A KEY FRAME is stored complete, and the frames after it are "
            "stored as differences from it until the next key frame.",
            "PERCEPTUAL modelling discards detail the eye is poor at "
            "noticing -- fine colour variation more readily than fine "
            "brightness variation.",
        ]),
        desc(
            "The key frame structure explains why seeking within a video is "
            "not instantaneous: the player must find the preceding key frame "
            "and reconstruct forward from it. It also explains why a video "
            "with rapid scene changes compresses far worse than a static one "
            "-- there is little temporal redundancy to remove, so almost "
            "every frame must be stored nearly in full."
        ),
    ]),

    ("Streaming and Delivery", [
        desc(
            "Media large enough to matter is usually delivered while it is "
            "being consumed, which introduces the real-time constraint the "
            "opening section identified."
        ),
        compare_grid(
            "DOWNLOAD AND STREAM",
            "The difference is whether playback waits for the whole file.",
            [("Download",
              "The entire file arrives before playback. Simple, robust once "
              "complete, and it requires storage on the device and a wait "
              "proportional to the file."),
             ("Streaming",
              "Playback begins after a short buffer fills and continues while "
              "the rest arrives. Starts almost immediately and requires "
              "sustained bandwidth -- if delivery falls behind consumption, "
              "playback stalls.")]),
        desc(
            "BUFFERING is what absorbs the difference between a variable "
            "network and a constant playback rate, and the buffer size is a "
            "direct trade: a larger buffer survives longer interruptions and "
            "delays the start proportionally. ADAPTIVE streaming resolves it "
            "differently, by encoding several quality levels and switching "
            "between them as measured bandwidth changes -- which is why video "
            "quality visibly drops rather than stopping."
        ),
        desc(
            "The examination's angle is usually the bandwidth calculation. "
            "Sustained delivery requires the bit rate to be available "
            "continuously, so a 5 Mbit/s stream needs 5 Mbit/s of real "
            "throughput throughout -- and a connection whose AVERAGE is "
            "adequate but which dips below that rate will stall, which is why "
            "peak requirements rather than averages govern."
        ),
    ]),

    ("Metadata", [
        desc(
            "Media cannot be searched by its content the way text can, so "
            "everything that makes a media library usable is metadata "
            "attached alongside."
        ),
        table(
            ["Kind", "Examples", "Where it comes from"],
            [["Technical", "Resolution, codec, duration, bit rate",
              "Generated automatically by the encoder"],
             ["Descriptive", "Title, subject, people, keywords",
              "Entered by a person, or inferred by analysis"],
             ["Administrative", "Owner, licence, retention, version",
              "Set by policy at ingest"],
             ["Structural", "Chapters, scenes, page order",
              "Produced during authoring"]],
            caption="Four kinds of metadata about one file.",
            footer="Only the first arrives free. The rest requires effort at "
                   "the point of creation, which is why media archives without "
                   "a cataloguing discipline become unsearchable long before "
                   "they become large."),
        desc(
            "Automated analysis increasingly generates descriptive metadata "
            "-- speech transcription, object and face recognition, scene "
            "detection -- which changes the economics considerably. It is "
            "worth noting that this is inference rather than fact: the "
            "metadata is a probabilistic guess, so a search over it returns "
            "approximately the right results and occasionally something "
            "unrelated."
        ),
    ]),

    ("Raster and Vector", [
        desc(
            "Two fundamentally different ways of describing an image, and the "
            "choice between them is decided by what the image IS rather than "
            "by how it will be used."
        ),
        compare_grid(
            "TWO DESCRIPTIONS OF AN IMAGE",
            "One records what each point looks like; the other records what "
            "shapes are present.",
            [("Raster (bitmap)",
              "A grid of pixels, each with a colour. Can represent anything, "
              "including a photograph -- and its size is fixed at capture, so "
              "enlarging it interpolates rather than revealing detail. Size "
              "depends on resolution and depth, not on complexity."),
             ("Vector",
              "A description of shapes: lines, curves, fills, text. Scales to "
              "any size with no loss because it is redrawn rather than "
              "stretched, and stays small for simple images. Cannot represent "
              "a photograph, which has no shapes to describe.")]),
        desc(
            "The size behaviour is the discriminating property and it runs "
            "opposite ways. A raster image's size depends on its dimensions "
            "and is indifferent to what it shows; a vector image's size "
            "depends on how many shapes it contains and is indifferent to how "
            "large it is displayed. A logo is therefore tiny as a vector at "
            "any size, and a photograph is impossible as one."
        ),
        desc(
            "RASTERISATION converts vector to raster, which is what happens "
            "whenever a vector image is displayed or printed -- so the "
            "resolution is chosen at that moment rather than at authoring. "
            "The reverse, tracing a raster image into vectors, is an "
            "approximation and works only on images that were shape-like to "
            "begin with."
        ),
    ]),

    ("Digital Rights and Media Protection", [
        desc(
            "Media is expensive to produce and trivial to copy, which "
            "produces a set of protection mechanisms the syllabus names."
        ),
        table(
            ["Mechanism", "What it does", "What it does not do"],
            [["Digital rights management", "Restricts playback to authorised "
                                           "devices or periods",
              "Prevent a determined attacker, or survive the service closing"],
             ["Watermarking", "Embeds an invisible identifier in the content",
              "Prevent copying -- it identifies the source afterwards"],
             ["Digital signature", "Proves the content is unmodified and who "
                                   "issued it",
              "Restrict what a recipient does with it"],
             ["Encryption in transit", "Prevents interception during "
                                       "delivery",
              "Protect the content once decrypted for playback"]],
            caption="Four mechanisms, and the gap each leaves.",
            footer="The recurring limitation is that playback requires "
                   "decryption, so the content is available in the clear at "
                   "some point on a device the owner controls. Protection "
                   "raises the effort required rather than making copying "
                   "impossible."),
        desc(
            "The examination's angle is usually the distinction between "
            "PREVENTING and DETECTING. Digital rights management attempts "
            "prevention and is always circumventable in principle; "
            "watermarking accepts that and identifies the source of a leak "
            "afterwards, which is a different and frequently more achievable "
            "goal. Choosing between them is a question about what the "
            "organisation actually needs."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where multimedia items are lost."),
        ul([
            "Computing file size in bits and reporting it as bytes.",
            "Forgetting the channel count when sizing audio.",
            "Saving diagrams or screenshots as JPEG, which produces artefacts "
            "around every sharp edge.",
            "Expecting to recover detail by enlarging an image. It was never "
            "captured.",
            "Repeatedly editing and re-saving a lossy file, which accumulates "
            "generation loss.",
            "Confusing a codec with a container. One compresses; the other "
            "packages.",
            "Assuming an average bandwidth adequate for a stream. Sustained "
            "rate is what matters.",
            "Confusing compression ratio with percentage saving.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"An audio recording is 3 minutes long, sampled at 44.1 kHz with "
            "16-bit depth in stereo. What is its uncompressed size, and what "
            "compression ratio is achieved if the delivered file is 3 MB?\""
        ),
        ol([
            "Compute bits per second: 44,100 samples x 16 bits x 2 channels = "
            "1,411,200 bits per second.",
            "Multiply by the duration: 1,411,200 x 180 seconds = 254,016,000 "
            "bits.",
            "Convert to bytes: divide by 8, giving 31,752,000 bytes -- about "
            "30.3 MiB.",
            "Compression ratio is original over compressed: roughly 30 MB / "
            "3 MB, which is about 10:1.",
            "Expressed as a saving instead, that is 90% of the size removed.",
        ]),
        desc(
            "Two habits make this reliable. Work in bits until the final "
            "conversion, because every parameter is given in bits and "
            "converting part-way is where the factor of eight goes astray. "
            "And read whether the question wants the RATIO or the SAVING -- "
            "10:1 and 90% describe the same result and only one will be among "
            "the options."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Multimedia applies several earlier lessons directly."),
        ul([
            "Sampling, quantisation and the sampling theorem come from Theory "
            "of Information.",
            "Lossless and lossy compression and Huffman coding come from the "
            "same lesson.",
            "Frame buffer arithmetic comes from Input/Output Devices.",
            "Streaming bandwidth and buffering are Network topics.",
            "Metadata and searchability reappear in Database.",
            "Captions and audio description are the accessibility "
            "requirements of Human Interface.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("Uncompressed audio size",
              "Rate x depth x channels x seconds, in bits",
              "Then divide by 8 for bytes. CD stereo is about 10 MiB per "
              "minute."),
             ("Uncompressed image size",
              "Width x height x bytes per pixel",
              "24-bit colour is 3 bytes. A 3000 x 2000 photograph is about "
              "17 MiB before compression."),
             ("Additive against subtractive colour",
              "RGB for emitted light, CMYK for ink",
              "All RGB gives white; all CMY gives muddy brown, which is why "
              "K exists."),
             ("Why JPEG is wrong for a screenshot",
              "It is tuned for continuous tone",
              "Sharp edges and flat colour acquire visible artefacts. PNG is "
              "lossless and handles both."),
             ("Codec against container",
              "Compression against packaging",
              "One container may hold many codecs, which is why a recognised "
              "file can still fail to play."),
             ("Why video compresses so much better than stills",
              "Temporal redundancy between frames",
              "Only the change from the previous frame is stored, until the "
              "next key frame.")]),
    ]),
]

_mt_quiz = [
    mcq("AVERAGE",
        "Audio is sampled at 44.1 kHz with 16-bit depth in stereo.\n\n"
        "What is the uncompressed size of one minute of this recording?",
        [("About 5.0 MiB", False),
         ("About 10.1 MiB", True),
         ("About 80.7 MiB", False),
         ("About 2.6 MiB", False)],
        "Bits per second is 44,100 x 16 x 2 = 1,411,200, and one minute gives "
        "84,672,000 bits. Dividing by 8 gives 10,584,000 bytes, about "
        "10.1 MiB. The value 80.7 MiB is the answer left in bits and labelled "
        "as bytes, and 5.0 MiB is the result with the stereo channel count "
        "omitted -- both are the standard errors on this calculation."),

    mcq("EASY",
        "Which format is most appropriate for a screenshot containing text "
        "and sharp-edged interface elements?",
        [("JPEG, because it achieves the highest compression", False),
         ("PNG, because it is lossless and handles sharp edges", True),
         ("MP3, because it discards imperceptible detail", False),
         ("SVG, because it scales without any loss of quality", False)],
        "JPEG is tuned for continuous-tone photographs and produces visible "
        "artefacts around sharp edges, which is exactly what text and "
        "interface elements consist of. PNG is lossless, supports "
        "transparency and compresses flat areas of colour well. SVG is a "
        "vector format with no way to describe captured pixels, and MP3 is "
        "audio."),

    mcq("AVERAGE",
        "Compressing a 40 MB image file produces an 8 MB result.\n\n"
        "What is the compression ratio, and what is the saving?",
        [("5:1, and a saving of 80%", True),
         ("8:1, and a saving of 20%", False),
         ("5:1, and a saving of 20%", False),
         ("20:1, and a saving of 80%", False)],
        "Compression ratio is original divided by compressed: 40 / 8 = 5, so "
        "5:1. The saving is the proportion removed: 32 MB of 40 MB is 80%. "
        "The two describe the same result in different terms and are easy to "
        "swap under time pressure, so read which one the question actually "
        "asks for -- both will usually appear among the options."),

    mcq("HARD",
        "Video compression achieves far higher ratios than still image "
        "compression.\n\nWhat is the principal reason?",
        [("Video frames are individually smaller than photographs", False),
         ("Consecutive frames differ little, so only changes need "
          "storing", True),
         ("Video codecs discard the colour information entirely", False),
         ("Video is stored at a lower resolution than still images", False)],
        "Temporal redundancy is the additional source video has and stills do "
        "not: a key frame is stored complete and subsequent frames are stored "
        "as differences from it, which is a small fraction of a full frame in "
        "a mostly static scene. This also explains two observed behaviours -- "
        "seeking is not instantaneous, because the player must reconstruct "
        "from the preceding key frame, and rapidly changing footage "
        "compresses far worse."),

    mcq("AVERAGE",
        "A video file has a recognised extension and opens in the player, but "
        "reports that it cannot be played.\n\n"
        "What is the most likely explanation?",
        [("The file is corrupt and must be downloaded again", False),
         ("The container is supported but the codec inside it is not", True),
         ("The file's resolution exceeds the display's capability", False),
         ("The container format has been renamed to a different "
          "extension", False)],
        "The extension identifies the CONTAINER, which packages streams and "
        "metadata, while the CODEC inside determines how the media was "
        "compressed -- and one container may hold any of several codecs. The "
        "player recognises and opens the container, then finds a codec it "
        "cannot decode. Nothing is corrupt; a piece of software is missing, "
        "which is why installing a codec resolves it."),

    mcq("EASY",
        "Why does printing use CMYK rather than RGB?",
        [("Printers cannot produce more than four distinct colours", False),
         ("Ink absorbs light, so colour mixing is subtractive", True),
         ("CMYK files are substantially smaller than RGB files", False),
         ("RGB is a proprietary model and cannot be used in print", False)],
        "A screen emits light and mixing more of it produces white, which is "
        "additive. Ink absorbs light and mixing more produces darker results, "
        "which is subtractive -- so the models are genuinely different rather "
        "than alternative notations. The K exists because cyan, magenta and "
        "yellow together give a muddy brown rather than true black, and "
        "because black ink is cheaper than three coloured ones."),

    mcq("HARD",
        "An image is repeatedly opened, edited slightly and saved again as a "
        "JPEG.\n\nWhat happens over many cycles?",
        [("Nothing, since the same compression settings are applied each "
          "time", False),
         ("Quality degrades progressively, because each save re-applies the "
          "lossy step", True),
         ("The file grows steadily as edit history accumulates", False),
         ("The image reverts to its original quality once saved at maximum "
          "settings", False)],
        "Each save discards information from what is already an approximation, "
        "so losses accumulate -- generation loss. Raising the quality setting "
        "on a later save cannot restore what earlier saves removed, because "
        "that information no longer exists in the file. The remedy is to keep "
        "a lossless master and export lossy copies from it, which is why "
        "production workflows are organised that way."),

    mcq("AVERAGE",
        "Average measured throughput comfortably exceeds a video "
        "stream's bit rate, yet playback stalls periodically.\n\n"
        "What explains this?",
        [("The average is adequate but throughput dips below the required "
          "rate", True),
         ("Streaming requires twice the bit rate of the video", False),
         ("The video's resolution exceeds the display's capability", False),
         ("Compression ratios vary, so the average is meaningless", False)],
        "Streaming imposes a SUSTAINED requirement: the data must arrive at "
        "least as fast as it is consumed, continuously. An average that "
        "includes periods well above the rate can conceal periods below it, "
        "and each of those drains the buffer until playback stalls. This is "
        "why peak and sustained requirements govern for real-time media "
        "rather than averages, and why adaptive streaming switches quality "
        "instead."),

    mcq("AVERAGE",
        "An uncompressed photograph measures 4,000 by 3,000 pixels at 24-bit "
        "colour.\n\nApproximately how large is it?",
        [("About 12 MB", False),
         ("About 36 MB", True),
         ("About 288 MB", False),
         ("About 4 MB", False)],
        "The pixel count is 4,000 x 3,000 = 12,000,000, and 24-bit colour is "
        "3 bytes each, giving 36,000,000 bytes. The value 12 MB counts one "
        "byte per pixel, and 288 MB leaves the result in bits. Note how large "
        "this is relative to a typical JPEG of the same photograph at 3 to "
        "5 MB, which is a ratio around 8:1 with no visible loss."),

    mcq("HARD",
        "A media archive of many thousands of video files becomes effectively "
        "unsearchable.\n\nWhat is the most likely underlying cause?",
        [("The files were stored in too many different container "
          "formats", False),
         ("Descriptive metadata was never captured at the point of "
          "ingest", True),
         ("Video files exceed the size limit of the file system's index",
          False),
         ("Lossy compression removed the information needed for "
          "searching", False)],
        "Media cannot be searched by its content the way text can, so "
        "everything that makes an archive findable is metadata alongside it. "
        "Technical metadata arrives free from the encoder; descriptive "
        "metadata -- subject, people, keywords -- requires effort at "
        "creation, and without a cataloguing discipline an archive becomes "
        "unsearchable long before it becomes large. Compression removes "
        "perceptual detail rather than anything a search would have used."),
]

LESSON_MM_TECH = lesson(
    MAJOR, MIDDLE,
    "Multimedia Technology: Encoding, Compression and Formats",
    _mt_quiz,
    lesson_structure(
        "Multimedia Technology: Encoding, Compression and Formats",
        "Text is small, exact and searchable; sound, images and video are none "
        "of those, and every technique here follows from that. This lesson "
        "digitises sound and images with the sampling and quantisation the "
        "Theory of Information lesson established, works the file size "
        "arithmetic the examination actually asks for, explains why screens "
        "and printers need different colour models, sets out what lossy "
        "compression buys and what generation loss costs, distinguishes a "
        "codec from a container, and explains why video compresses "
        "dramatically better than stills and what that implies for seeking "
        "and for streaming.",
        [
            "Explain what distinguishes media from text and why that drives "
            "compression",
            "Compute uncompressed audio and image sizes and a compression "
            "ratio",
            "Explain sample rate, bit depth, resolution and colour depth",
            "Distinguish additive from subtractive colour and explain gamut",
            "Choose an appropriate format for a described kind of content",
            "Distinguish a codec from a container and diagnose a playback "
            "failure",
            "Explain temporal redundancy and its consequences for seeking and "
            "compression",
            "Explain buffering and why sustained bandwidth governs streaming",
        ],
        65,
        _mt_sections,
        [
            ("Sample rate",
             "Measurements per second when digitising sound. Must exceed "
             "twice the highest frequency present, which is why CD audio "
             "samples at 44.1 kHz."),
            ("Bit depth",
             "Bits per sample or per colour channel. Each extra bit halves "
             "the quantisation error."),
            ("Resolution",
             "The sampling density of an image, in pixels or dots per inch. "
             "Detail finer than the interval is never captured."),
            ("Colour depth",
             "Bits per pixel. 24-bit gives about 16.7 million colours and "
             "occupies three bytes."),
            ("Additive colour (RGB)",
             "Mixing emitted light, where all three at full give white. The "
             "model for screens and cameras."),
            ("Subtractive colour (CMYK)",
             "Mixing inks that absorb light, where more means darker. K is "
             "added because CMY together give a muddy brown."),
            ("Gamut",
             "The set of colours a device can reproduce. Screen and printer "
             "gamuts differ, which is why a vivid screen colour may print "
             "dull."),
            ("Compression ratio",
             "Original size divided by compressed size. Distinct from the "
             "percentage saving, which is the proportion removed."),
            ("Generation loss",
             "Cumulative degradation from repeatedly re-saving a lossy file. "
             "Raising the quality setting later cannot restore what earlier "
             "saves discarded."),
            ("Codec",
             "The scheme by which media is compressed and decompressed."),
            ("Container",
             "The format packaging compressed streams with their metadata and "
             "synchronisation. One container may hold many codecs, which is "
             "why a recognised file can fail to play."),
            ("Temporal redundancy",
             "The similarity between consecutive video frames, exploited by "
             "storing only the changes since the last key frame."),
            ("Key frame",
             "A frame stored complete, from which following frames are "
             "reconstructed. Why seeking is not instantaneous."),
            ("Buffering",
             "Holding received data ahead of playback to absorb variation in "
             "delivery. A larger buffer survives longer interruptions and "
             "delays the start."),
            ("Adaptive streaming",
             "Encoding several quality levels and switching between them as "
             "bandwidth changes, so quality degrades rather than playback "
             "stopping."),
        ],
        "Media differs from text in being large, inexact, unsearchable and "
        "time-bound, and each of those drives something here. Digitising "
        "sound needs a sample rate above twice the highest frequency and a "
        "bit depth setting the amplitude resolution; digitising an image "
        "needs resolution and colour depth -- and the arithmetic the "
        "examination asks for is simply rate times depth times channels times "
        "duration, or width times height times bytes per pixel, worked in "
        "bits until the final conversion. Colour needs two models because a "
        "screen emits light additively and ink absorbs it subtractively, and "
        "their gamuts do not coincide. Compression divides into lossless, "
        "recovering the original exactly at modest ratios, and lossy, "
        "achieving far more by discarding what perception will not miss -- at "
        "the cost of generation loss that accumulates with every re-save and "
        "cannot be undone by raising the quality setting afterwards. A codec "
        "compresses and a container packages, which is why a recognised file "
        "can still fail to play. Video compresses dramatically better than "
        "stills because consecutive frames barely differ, so only changes "
        "since the last key frame are stored -- which is also why seeking "
        "takes time and why fast-moving footage compresses badly. And "
        "delivery is governed by SUSTAINED bandwidth rather than average, "
        "which is what buffering absorbs and adaptive streaming works "
        "around.",
        exam_notes=[
            desc(
                "Multimedia items on Subject A are predominantly arithmetic, "
                "with format and terminology identification alongside."
            ),
            ul([
                "Computing uncompressed audio or image size.",
                "Computing a compression ratio or percentage saving.",
                "Choosing a format for described content.",
                "Distinguishing a codec from a container.",
                "Explaining generation loss.",
                "Explaining why a stream stalls despite adequate average "
                "bandwidth.",
                "Distinguishing additive from subtractive colour.",
            ]),
            desc(
                "Work every size calculation in bits and convert once at the "
                "end. The factor of eight is where these items are lost, and "
                "the wrong answer by that factor is always among the options."
            ),
        ],
    ))

LESSONS = [LESSON_MM_TECH]

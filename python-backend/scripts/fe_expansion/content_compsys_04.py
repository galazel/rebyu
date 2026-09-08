"""Computer System -> Computer Component lesson 5, and System Component.

Syllabus minor category 5 of Computer Component (input/output device), then
System Component's two minor categories: system configuration and system
evaluation indexes.

The System Component material is disproportionately valuable. Availability,
MTBF and MTTR arithmetic appears on Subject A every sitting, and the same
formulas reappear in Service Management as service level targets and in
Project Risk Management as impact estimates -- so the calculations here are
worked rather than stated.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, media_text, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Computer System"

# ==========================================================================
# Lesson 5: Input/output devices
# ==========================================================================

_dev_sections = [
    ("Devices as Categories, Not as a List", [
        desc(
            "There are far too many peripherals to memorise, and the "
            "examination does not ask you to. It asks you to place a "
            "described device in a category, or to compute something from its "
            "stated properties -- so the categories and the properties are "
            "what this lesson establishes."
        ),
        image(fig("io-device-classes")),
        desc(
            "The most useful classification is by how data moves, because "
            "that is what decides how the operating system talks to a device "
            "and it is stable as technologies change."
        ),
        table(
            ["Class", "Unit of transfer", "Addressable?", "Examples"],
            [["Character device", "One character or byte at a time", "No",
              "Keyboard, mouse, serial port, printer"],
             ["Block device", "Fixed-size blocks", "Yes, by block number",
              "Hard disk, SSD, optical drive"],
             ["Network device", "Framed packets",
              "By protocol address, not position",
              "Ethernet and wireless adapters"]],
            caption="Three classes, and what distinguishes them.",
            footer="A block device can be asked for block 4,192 directly, "
                   "which is what makes a file system and a database index "
                   "possible. A character device offers only the next "
                   "character, so any random access must be built above it."),
    ]),

    ("Input Devices and How They Report", [
        desc(
            "Input devices convert a physical action into data. Grouping them "
            "by what they capture matches how examination items describe "
            "them."
        ),
        content_accordion(
            "CATEGORIES OF INPUT DEVICE",
            "Each group shares a characteristic problem, which is more useful "
            "than the individual device names.",
            [("Keyboards and pointing devices",
              "Convert discrete actions into codes. A key generates a scan "
              "code that the operating system maps to a character through the "
              "current layout -- which is why the same key produces different "
              "characters on different layouts, and why the mapping is "
              "software rather than hardware."),
             ("Image capture",
              "Scanners and cameras sample light into a grid of pixels. "
              "Resolution is measured in dots or pixels per inch, and the "
              "sampling and quantisation of the Theory of Information lesson "
              "apply directly -- including the fact that detail below the "
              "sampling resolution is gone for good."),
             ("Code readers",
              "Barcode and QR readers, magnetic stripe and IC card readers, "
              "RFID. Each reads an encoded identifier rather than free data, "
              "which is why they carry check digits: a misread here would "
              "silently identify the wrong item rather than failing "
              "visibly."),
             ("Biometric sensors",
              "Fingerprint, face and iris readers convert a physical "
              "characteristic into a template for comparison. The match is "
              "never exact, so a threshold is required and both false "
              "acceptances and false rejections follow from it -- treated at "
              "length in the Security lessons."),
             ("Environmental sensors",
              "Temperature, pressure, motion and light sensors feeding the "
              "control systems the Basic Theory lesson described.")]),
        desc(
            "The check-digit point generalises usefully. Wherever a device "
            "reads an identifier rather than free text, a misread produces a "
            "VALID-LOOKING but wrong value, so the encoding itself must carry "
            "enough redundancy to detect one. This is the error-detection "
            "material of the Communications lesson applied at the point of "
            "capture."
        ),
    ]),

    ("Output Devices and Display Technology", [
        desc(
            "Output devices convert data into something a person can "
            "perceive. Two families dominate examination items, and the "
            "display properties are the calculable ones."
        ),
        table(
            ["Property", "What it means", "Why it is asked about"],
            [["Resolution", "Pixels across by pixels down",
              "Sets the memory a frame needs"],
             ["Colour depth", "Bits per pixel",
              "24-bit gives about 16.7 million colours"],
             ["Refresh rate", "Frames drawn per second",
              "Below about 60 Hz, motion is visibly poor"],
             ["Dot pitch", "Distance between adjacent pixels",
              "Smaller means sharper at a given physical size"],
             ["Response time", "How quickly a pixel changes",
              "Slow response smears moving images"]],
            caption="Display properties, and what each one costs or buys.",
            footer="Frame buffer size is the calculation to expect: width x "
                   "height x bytes per pixel. A 1,920 x 1,080 display at 24 "
                   "bits needs 1920 x 1080 x 3 bytes, about 6.2 MB per "
                   "frame."),
        desc(
            "Printers divide by how the mark is made. An IMPACT printer "
            "strikes the paper, which is slow and noisy and is the only kind "
            "able to produce carbon copies -- the reason dot-matrix printers "
            "survive on multi-part forms. A LASER printer builds a whole page "
            "electrostatically and fuses toner to it, giving high quality at "
            "speed. An INKJET sprays droplets, cheap to buy and dear per "
            "page. A 3D printer builds an object by adding material in "
            "layers, which the syllabus groups here."
        ),
        desc(
            "One distinction worth holding: a laser printer composes a PAGE "
            "at a time and an inkjet or impact printer composes a LINE at a "
            "time. That is why a laser printer needs enough memory to hold a "
            "rendered page, and why a complex page can exhaust it while a "
            "simple one prints without difficulty."
        ),
    ]),

    ("Storage Devices as Peripherals", [
        desc(
            "Storage was covered in the Memory lesson as part of the "
            "hierarchy. Here it matters as a device with an interface, "
            "because that is what the examination asks about at this point."
        ),
        table(
            ["Device", "Access", "Removable?", "Characteristic use"],
            [["Internal HDD or SSD", "Block, random", "No",
              "Primary storage for a system"],
             ["External drive", "Block, random", "Yes",
              "Backup and transport"],
             ["Optical disc", "Block, slow random", "Yes",
              "Distribution and archival"],
             ["Magnetic tape", "Sequential only", "Yes",
              "Bulk archival, offsite retention"],
             ["Memory card / USB stick", "Block, random", "Yes",
              "Portable data, camera storage"],
             ["Network attached storage", "Block or file, over a network",
              "No", "Shared storage for many machines"]],
            caption="Storage peripherals, by how they are reached.",
            footer="Removability is what makes a medium suitable for OFFSITE "
                   "retention, which is a requirement no amount of redundancy "
                   "inside one building satisfies."),
        desc(
            "That last point connects to the Memory lesson's warning about "
            "RAID. Redundancy inside a machine protects against a component "
            "failing; it does nothing about a fire, a theft or a ransomware "
            "encryption that reaches everything mounted. Removable media, "
            "taken elsewhere, is what answers those -- which is why backup "
            "policy in Service Management insists on it."
        ),
    ]),

    ("Device Selection Criteria", [
        desc(
            "Examination items give a requirement and ask which device suits "
            "it. The criteria are consistent and worth having as a checklist."
        ),
        ul([
            "THROUGHPUT: how much data per second, which decides the "
            "interface as much as the device.",
            "LATENCY: how long an individual operation takes, which matters "
            "far more for interactive work than throughput does.",
            "CAPACITY: how much it holds, and whether that can grow.",
            "DURABILITY: how long the medium survives, and how many write "
            "cycles it tolerates.",
            "PORTABILITY: whether it can be moved, which is what enables "
            "offsite storage.",
            "COST per byte, which differs by orders of magnitude across the "
            "table above.",
            "ENVIRONMENT: temperature, vibration and dust tolerance, which "
            "rule out mechanical devices in many industrial settings.",
        ]),
        desc(
            "The criteria conflict, which is the point. The cheapest per byte "
            "is tape and it has the worst latency by a wide margin; the "
            "lowest latency is flash and it has limited write endurance and "
            "the highest cost per byte of the practical options. A question "
            "asking which device is 'best' without stating a priority is not "
            "answerable, and a well-written item always states one."
        ),
    ]),

    ("Human Interface Considerations", [
        desc(
            "Devices are used by people, and the syllabus expects some "
            "awareness of that here before the Human Interface middle "
            "category treats it properly."
        ),
        compare_grid(
            "WHAT MAKES A DEVICE USABLE",
            "Each of these is a real selection criterion and each appears in "
            "accessibility requirements.",
            [("Physical accessibility",
              "Can it be operated by someone with limited dexterity, vision "
              "or hearing? Alternative input devices -- switch access, eye "
              "tracking, voice -- exist because standard ones exclude "
              "people."),
             ("Feedback",
              "Does the device confirm that input was received? A key with "
              "no tactile or audible response, or a touchscreen with no "
              "visual acknowledgement, produces repeated input and errors."),
             ("Error tolerance",
              "How easily is an unintended action triggered, and how easily "
              "undone? A control that is destructive and adjacent to a common "
              "one is a design fault rather than a user fault."),
             ("Fatigue",
              "A device used for hours has different requirements from one "
              "used for seconds, which is why ergonomics is a procurement "
              "criterion and not a preference.")]),
        desc(
            "The connecting idea, and the one the Human Interface lessons "
            "develop: a device that is technically capable and unusable by "
            "the people who must use it has not met its requirement. "
            "Usability is a functional property, not a finishing touch."
        ),
    ]),

    ("Resolution, Sampling and What Cannot Be Recovered", [
        desc(
            "Capture devices and display devices share one property that "
            "produces a great deal of confusion in practice: detail below the "
            "sampling resolution is not merely faint, it is absent."
        ),
        table(
            ["Situation", "What is lost", "Can it be recovered?"],
            [["Scanning at 150 dpi", "Detail finer than 1/150 inch",
              "No -- it was never captured"],
             ["Photographing at 2 megapixels",
              "Anything below one pixel of subject", "No"],
             ["Enlarging a captured image", "Nothing further",
              "No new detail appears; pixels are interpolated"],
             ["Displaying on a lower-resolution screen",
              "Detail beyond the screen's pixels",
              "Yes -- the data is intact and a better screen shows it"]],
            caption="Where information is genuinely destroyed, and where it "
                    "is merely not shown.",
            footer="The last row is the only reversible one. Capture "
                   "resolution is a decision that cannot be revisited; "
                   "display resolution can."),
        desc(
            "This is the sampling theorem from the Theory of Information "
            "lesson, met as an operational rule. Enlarging a low-resolution "
            "image does not reveal detail because there is none to reveal -- "
            "the software is inventing plausible pixels between the ones that "
            "exist. Any workflow that might later need more detail must "
            "capture it at the outset, which is why archival scanning is done "
            "at resolutions far above immediate need."
        ),
        desc(
            "The same reasoning governs audio capture and every other "
            "analogue-to-digital path. Sample rate and bit depth are chosen "
            "once, at capture, and no later processing recovers what fell "
            "between the samples."
        ),
    ]),

    ("Multimedia and Specialised Devices", [
        desc(
            "Beyond the general-purpose peripherals, the syllabus names a "
            "group whose defining property is that they handle continuous "
            "media or a specific physical task."
        ),
        table(
            ["Device", "Handles", "Distinguishing constraint"],
            [["Sound card / audio interface", "Analogue audio in and out",
              "Sample rate and bit depth decide fidelity"],
             ["Graphics processor", "Parallel pixel and vector computation",
              "Its own dedicated memory, for bandwidth reasons"],
             ["Video capture", "Continuous frames", "Sustained throughput, "
                                                    "not peak"],
             ["Touchscreen", "Position and gesture, overlaid on a display",
              "Input and output share one surface"],
             ["Projector", "Display onto an external surface",
              "Ambient light limits usable contrast"],
             ["Plotter", "Precise line drawing", "Draws vectors rather than "
                                                 "rasterising them"]],
            caption="Specialised devices, and the constraint each is designed "
                    "around.",
            footer="Video capture is the one worth noticing: it needs "
                   "SUSTAINED throughput rather than a high peak, because a "
                   "single missed frame is visible and cannot be recovered."),
        desc(
            "The sustained-versus-peak distinction generalises well beyond "
            "video. Any device handling continuous media has a real-time "
            "constraint in the sense the Basic Theory lesson defined: late "
            "data is useless data, so the system must be sized for its worst "
            "case rather than its average, and buffering exists to absorb the "
            "difference between them."
        ),
    ]),

    ("Virtual and Shared Devices", [
        desc(
            "Not every device a program uses exists. Several layers present "
            "something device-shaped that is really software, and the "
            "syllabus expects the terms."
        ),
        content_accordion(
            "DEVICES THAT ARE NOT DEVICES",
            "Each solves a real problem, and each is examined by description "
            "rather than by name.",
            [("Virtual device",
              "Software presenting a device interface without hardware behind "
              "it -- a virtual printer that produces a PDF, a RAM disk that "
              "looks like a drive, a loopback network interface. Programs "
              "written for the real thing work unchanged, which is the whole "
              "value."),
             ("Device in a virtual machine",
              "A hypervisor presents virtual hardware to a guest operating "
              "system and maps it onto real hardware, possibly of a different "
              "kind. This is what lets one physical machine host many guests "
              "with different device requirements."),
             ("Shared network device",
              "A printer or storage volume reached over a network and used by "
              "many machines. The sharing must be arbitrated, which is what "
              "print spooling and file locking are for."),
             ("Emulated device",
              "Software imitating a device that may no longer exist, so old "
              "software continues to run. Slower than the original by "
              "definition, since every operation is interpreted.")]),
        desc(
            "The unifying principle is the one the interfaces lesson "
            "established: because a device is reached through a defined "
            "interface rather than directly, anything implementing that "
            "interface can stand in for it. Abstraction is what makes "
            "virtualisation possible, and it is why the Software lessons "
            "treat the two together."
        ),
    ]),

    ("Device Reliability and Consumables", [
        desc(
            "Peripherals fail more often than the components inside a "
            "machine, because most of them contain moving parts, consumable "
            "materials, or both. Planning for that is an operational "
            "requirement rather than an afterthought."
        ),
        table(
            ["Device", "What wears out", "Operational consequence"],
            [["Mechanical hard disk", "Bearings, heads, the medium",
              "Failure is expected; redundancy is planned for it"],
             ["Solid state drive", "Erase cycles per cell",
              "Finite total writes; monitored as remaining life"],
             ["Printer", "Toner, ink, drum, fuser, rollers",
              "Consumable supply is a recurring cost and a stock problem"],
             ["Keyboard and mouse", "Switches and contacts",
              "Cheap to replace, so replacement rather than repair"],
             ["Display", "Backlight brightness over time",
              "Degrades gradually rather than failing outright"],
             ["Battery", "Charge cycles and calendar age",
              "Capacity falls whether used or not"]],
            caption="What actually fails, device by device.",
            footer="The last row catches people out in procurement: a battery "
                   "ages on the shelf, so buying spares years in advance "
                   "wastes most of their life."),
        desc(
            "The distinction that matters for planning is between failures "
            "that are SUDDEN and those that are GRADUAL. A sudden failure is "
            "answered by redundancy and by a spare; a gradual one is answered "
            "by monitoring and by scheduled replacement before it becomes a "
            "problem. Treating a gradual failure as sudden means discovering "
            "it at the worst moment, which is precisely what condition "
            "monitoring in Service Management exists to prevent."
        ),
    ]),

    ("Power and Environmental Requirements", [
        desc(
            "Devices consume power and produce heat, and at any scale beyond "
            "a single desk both become planning constraints rather than "
            "details."
        ),
        ul([
            "POWER consumption determines the supply capacity and the "
            "uninterruptible power supply that must back it, and it is "
            "cumulative -- a rack of equipment draws what a small building "
            "does.",
            "HEAT is essentially all of that power, since almost every watt "
            "consumed by electronics becomes heat. Cooling therefore has to "
            "remove roughly as much energy as the equipment draws, which is "
            "why data centre cooling costs approach the equipment's own power "
            "cost.",
            "PHYSICAL SPACE, weight and floor loading matter for racked "
            "equipment, and are a genuine constraint in converted buildings.",
            "ENVIRONMENTAL tolerance -- temperature, humidity, dust, "
            "vibration -- rules out mechanical devices in industrial and "
            "vehicle settings, which is one of the reasons solid state "
            "storage displaced disks there first.",
        ]),
        desc(
            "GREEN COMPUTING is the syllabus's term for taking this "
            "seriously: choosing efficient equipment, consolidating "
            "underused machines through virtualisation, managing power states "
            "so idle devices draw less, and disposing of equipment "
            "responsibly at end of life. It is treated properly in the "
            "Facility Management lesson, and it begins here because the "
            "figures start with the devices."
        ),
    ]),

    ("Configuring and Managing Devices", [
        desc(
            "A device attached to a system has to be recognised, configured "
            "and kept working. Three mechanisms handle that, and they are "
            "examined by name."
        ),
        compare_grid(
            "FROM PLUGGED IN TO USABLE",
            "Each of these removed a category of manual work that was once "
            "routine.",
            [("Plug and play",
              "The device identifies itself when asked, so the system can "
              "select and load the right driver and allocate resources "
              "without manual configuration. Before it, interrupt lines and "
              "addresses were set by hand and conflicts were common."),
             ("Hot-plugging",
              "The device may be attached and removed while the system runs, "
              "which requires the interface to detect arrival and departure "
              "and the operating system to load and unload drivers "
              "dynamically -- and requires the user to stop using a device "
              "before removing it."),
             ("Driver management",
              "Drivers must be obtained, installed, updated and occasionally "
              "rolled back. Because a driver runs with high privilege, a "
              "faulty or malicious one compromises the whole system, which is "
              "why signed drivers exist."),
             ("Firmware updates",
              "Many devices hold their own software, which is updated "
              "separately from the operating system. An interrupted firmware "
              "update can leave a device permanently unusable, which is why "
              "the process is treated as a change requiring planning.")]),
        desc(
            "The privilege point is worth carrying into the Security "
            "lessons. A device driver executes inside the operating system "
            "with full access to memory and hardware, so installing one is a "
            "far larger trust decision than installing an application -- and "
            "driver signing exists precisely because that trust cannot be "
            "verified by inspection."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where device items are lost."),
        ul([
            "Classifying a tape as a block device because it stores blocks. "
            "It is reached sequentially, which is what matters.",
            "Computing frame buffer size in bits and reporting it as bytes.",
            "Assuming higher resolution is always better. It multiplies "
            "memory, bandwidth and rendering cost.",
            "Treating an external drive left beside the machine as offsite "
            "storage.",
            "Choosing a device on throughput when the requirement was "
            "latency, or the reverse.",
            "Forgetting that a laser printer composes a whole page and needs "
            "memory for it.",
            "Overlooking check digits on code readers, which exist because a "
            "misread produces a valid-looking wrong value.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A display is 1,600 by 1,200 pixels with 24-bit colour, "
            "refreshed 60 times per second. How much memory does one frame "
            "occupy, and what bandwidth does refreshing it require?\""
        ),
        ol([
            "Pixels per frame: 1,600 x 1,200 = 1,920,000.",
            "Bytes per pixel: 24 bits is 3 bytes.",
            "Frame buffer: 1,920,000 x 3 = 5,760,000 bytes, about 5.5 MiB.",
            "Bandwidth: 5,760,000 bytes x 60 frames per second = "
            "345,600,000 bytes per second, about 330 MB/s.",
        ]),
        desc(
            "The second figure is the one worth noticing. Simply keeping a "
            "modest display refreshed consumes a third of a gigabyte per "
            "second of memory bandwidth, continuously, before anything is "
            "drawn -- which is why graphics hardware has its own dedicated "
            "memory rather than sharing the system's, and why raising "
            "resolution costs far more than the pixel count suggests."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Devices are where several later topics attach."),
        ul([
            "Sampling and quantisation in image capture come from Theory of "
            "Information and return in Multimedia.",
            "Check digits on code readers are the error detection of the "
            "Communications lesson.",
            "Biometric thresholds and false acceptance rates are Security "
            "material.",
            "Removable media is what makes offsite backup possible in Service "
            "Management.",
            "Accessibility and feedback are developed in Human Interface.",
            "Frame buffer bandwidth is why the Memory lesson's hierarchy "
            "matters to graphics.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Five results this lesson expects immediately.",
            [("Frame buffer size",
              "Width x height x bytes per pixel",
              "24-bit colour is 3 bytes. Multiply by the refresh rate for the "
              "bandwidth simply to keep the display lit."),
             ("Character against block device",
              "A stream against addressable blocks",
              "A block device can be asked for block n directly, which is "
              "what file systems and indexes depend on."),
             ("Why code readers carry check digits",
              "A misread yields a valid-looking wrong value",
              "It identifies the wrong item silently rather than failing "
              "visibly, so the encoding must detect its own errors."),
             ("The only printer type giving carbon copies",
              "Impact",
              "Which is why dot-matrix printers survive on multi-part forms "
              "long after they were obsolete for everything else."),
             ("What makes a medium suitable for offsite backup",
              "Removability",
              "No amount of redundancy inside one building answers a fire, a "
              "theft, or ransomware reaching everything mounted.")]),
    ]),
]

_dev_quiz = [
    mcq("EASY",
        "Which characteristic distinguishes a block device from a character "
        "device?",
        [("A block device transfers data faster", False),
         ("A block device can be addressed by block number", True),
         ("A block device requires no device driver", False),
         ("A block device connects through an external interface", False)],
        "A block device is addressable: any block can be requested directly "
        "by number, which is exactly what makes a file system and a database "
        "index possible. A character device supplies only the next character "
        "in a stream, so any random access must be constructed above it. "
        "Speed, driver requirements and interface type vary independently of "
        "this classification."),

    mcq("AVERAGE",
        "Consider a display of 1,600 by 1,200 pixels with 24-bit colour.\n\n"
        "How much memory does a single frame buffer require?",
        [("About 1.8 MB", False),
         ("About 5.5 MiB", True),
         ("About 46 MB", False),
         ("About 2.3 MB", False)],
        "There are 1,600 x 1,200 = 1,920,000 pixels, and 24-bit colour is 3 "
        "bytes each, so the buffer is 5,760,000 bytes -- about 5.5 MiB. The "
        "value 46 MB comes from leaving the result in bits, and 1.8 MB "
        "reports the pixel count as though each pixel took one byte. "
        "Multiplying this by the refresh rate gives the bandwidth needed "
        "merely to keep the display lit."),

    mcq("AVERAGE",
        "Magnetic tape stores data in blocks but is described as a "
        "sequential-access medium.\n\n"
        "Why?",
        [("Its blocks are too large to address individually", False),
         ("Reaching a given block requires winding through the tape to reach "
          "it", True),
         ("Tape drives lack the electronics to decode block addresses",
          False),
         ("Tape stores only character data, never structured blocks", False)],
        "The medium is physically linear, so reading block 40,000 means "
        "moving the tape until that point is under the head -- potentially "
        "minutes. Blocks exist and are numbered; what is missing is the "
        "ability to reach one without traversing what precedes it. This is "
        "why tape suits bulk archival, where sequential streaming throughput "
        "is excellent and terrible latency costs nothing."),

    mcq("HARD",
        "Nightly backup copies are stored on an external drive that "
        "remains connected to the server.\n\n"
        "Which risk does this fail to address?",
        [("Failure of the server's primary disk", False),
         ("Accidental deletion of a file by a user", False),
         ("Ransomware encrypting everything the server can write to", True),
         ("Corruption of a single database record", False)],
        "A connected drive is writable by the server, so malicious encryption "
        "reaching the server reaches the backups too -- and so would a fire "
        "or a theft affecting the building. It does protect against a primary "
        "disk failing and, since it holds copies from previous points in "
        "time, against deletion and corruption. Removability and offsite "
        "retention are what close the remaining gap."),

    mcq("EASY",
        "Which type of printer is capable of producing carbon copies on "
        "multi-part forms?",
        [("Impact", True),
         ("Laser", False),
         ("Inkjet", False),
         ("Thermal", False)],
        "Only an impact printer physically strikes the paper, and that "
        "mechanical force is what transfers the image through the layers of a "
        "multi-part form. Laser printers fuse toner electrostatically, "
        "inkjets spray droplets and thermal printers apply heat -- none of "
        "which reaches a second sheet. It is the reason dot-matrix printers "
        "survive in logistics and finance long after becoming obsolete for "
        "everything else."),

    mcq("AVERAGE",
        "Barcode and IC card readers encode a check digit alongside the "
        "identifier.\n\n"
        "What problem does this address?",
        [("Readers cannot detect when no code is present", False),
         ("A misread would otherwise produce a valid-looking but wrong "
          "identifier", True),
         ("Check digits allow the same code to be read at any orientation",
          False),
         ("Check digits compress the identifier into fewer characters",
          False)],
        "Unlike free text, where a misread is usually visible as nonsense, a "
        "corrupted identifier is still a well-formed identifier -- it simply "
        "names the wrong item, silently. The check digit adds enough "
        "redundancy for the reader to detect that the digits are "
        "inconsistent, which is the error-detection principle of the "
        "Communications lesson applied at the point of capture."),

    mcq("HARD",
        "Simple documents print without difficulty on a laser printer, "
        "but a complex graphics-heavy page fails.\n\n"
        "What is the most likely cause?",
        [("The toner cartridge cannot supply enough coverage", False),
         ("Insufficient printer memory to hold the rendered page", True),
         ("The interface bandwidth is too low for graphical data", False),
         ("Laser printers cannot render continuous-tone images", False)],
        "A laser printer composes an entire PAGE before printing any of it, "
        "so it must hold a full rendered bitmap in memory. A complex page "
        "renders to more data than a simple one, and a printer with limited "
        "memory can exhaust it -- which is why the symptom depends on page "
        "complexity rather than on volume. Line-at-a-time printers such as "
        "inkjets do not have this failure mode."),

    mcq("AVERAGE",
        "An application requires the lowest possible latency for individual "
        "read operations, and total capacity is a secondary concern.\n\n"
        "Which storage medium best fits?",
        [("Magnetic tape", False),
         ("Solid state drive", True),
         ("Optical disc", False),
         ("Mechanical hard disk", False)],
        "Flash storage has no head to move and no platter to rotate, so an "
        "individual read completes in tens of microseconds against "
        "milliseconds for a mechanical disk -- roughly two orders of "
        "magnitude better on exactly the property specified. Tape and "
        "optical media are worse still on latency, and both would be "
        "chosen for capacity or cost per byte, which the requirement "
        "explicitly subordinates."),

    mcq("AVERAGE",
        "Pressing a key generates a scan code, which the operating system "
        "maps to a character.\n\n"
        "What does this arrangement make possible?",
        [("Keyboards can operate without a device driver", False),
         ("The same physical keyboard can produce different characters under "
          "different layouts", True),
         ("Scan codes are transmitted more compactly than characters", False),
         ("Key presses can be detected without an interrupt", False)],
        "Because the key reports its POSITION rather than a character, the "
        "mapping from position to character lives in software and can be "
        "changed -- which is what lets one physical keyboard serve many "
        "languages and layouts, and what makes remapping keys possible at "
        "all. A driver is still required, and the mechanism has nothing to do "
        "with compactness or with how key presses are signalled."),

    mcq("HARD",
        "Refreshing a 1,920 by 1,080 display at 24-bit colour and 60 Hz is "
        "described as consuming substantial memory bandwidth.\n\n"
        "Approximately how much, and what design does this explain?",
        [("About 6 MB/s, which explains why displays need dedicated cables",
          False),
         ("About 370 MB/s, which explains why graphics hardware has its own "
          "memory", True),
         ("About 124 MB/s, which explains why refresh rates are capped at 60 "
          "Hz", False),
         ("About 3 GB/s, which explains why displays use compression", False)],
        "One frame is 1920 x 1080 x 3 = 6,220,800 bytes, and at 60 frames per "
        "second that is about 373 MB/s -- consumed continuously, simply to "
        "keep the display lit, before anything is drawn. Sharing system "
        "memory bandwidth at that rate would starve the processor, which is "
        "precisely why graphics subsystems carry dedicated memory. It also "
        "explains why raising resolution costs more than the pixel count "
        "alone suggests."),
]

LESSON_DEVICES = lesson(
    MAJOR, "Computer Component",
    "Input/Output Devices and Peripherals",
    _dev_quiz,
    lesson_structure(
        "Input/Output Devices and Peripherals",
        "There are far too many peripherals to memorise and the examination "
        "does not ask you to -- it asks you to place a described device in a "
        "category, or to compute something from its stated properties. This "
        "lesson establishes both: the classification by how data moves, which "
        "survives changes in technology; the input families and the "
        "characteristic problem each carries; display and printer properties "
        "including the frame buffer arithmetic; storage as a peripheral with "
        "an interface; and the criteria for choosing between devices when, as "
        "always, they conflict.",
        [
            "Classify a device as character, block or network by how data "
            "moves",
            "Identify the input device family a described device belongs to",
            "Explain why code readers carry check digits",
            "Compute frame buffer size and refresh bandwidth from display "
            "properties",
            "Compare printer technologies and identify which suits a stated "
            "requirement",
            "Compare storage peripherals on access, removability and cost",
            "Apply selection criteria to choose a device for a stated "
            "priority",
        ],
        55,
        _dev_sections,
        [
            ("Character device",
             "A device transferring one character at a time as a stream, with "
             "no addressable positions. Keyboards, mice, serial ports."),
            ("Block device",
             "A device transferring fixed-size blocks that can be requested "
             "by number. What makes file systems and database indexes "
             "possible."),
            ("Scan code",
             "The position code a key reports, mapped to a character in "
             "software -- which is why one keyboard serves many layouts."),
            ("Check digit",
             "Redundancy in an encoded identifier allowing a misread to be "
             "detected. Necessary because a corrupted identifier is still "
             "well-formed and names the wrong item silently."),
            ("Resolution",
             "The pixel dimensions of a display or the sampling density of a "
             "scanner. Multiplies memory, bandwidth and rendering cost."),
            ("Colour depth",
             "Bits per pixel. 24-bit gives about 16.7 million colours and "
             "occupies three bytes per pixel."),
            ("Frame buffer",
             "The memory holding one screen image: width x height x bytes per "
             "pixel. Multiplied by the refresh rate it gives the bandwidth "
             "needed merely to keep the display lit."),
            ("Dot pitch",
             "The distance between adjacent pixels. Smaller means a sharper "
             "image at a given physical size."),
            ("Impact printer",
             "A printer that physically strikes the paper. Slow and noisy, "
             "and the only kind able to produce carbon copies on multi-part "
             "forms."),
            ("Laser printer",
             "A printer composing a whole page electrostatically and fusing "
             "toner. Needs memory for the rendered page, which is why a "
             "complex page can fail where a simple one succeeds."),
            ("Sequential access medium",
             "A medium in which reaching a position requires traversing what "
             "precedes it. Tape stores blocks and is still sequential."),
            ("Removable media",
             "Storage that can be detached and taken elsewhere, which is what "
             "makes offsite retention possible. No redundancy inside one "
             "building substitutes for it."),
        ],
        "Peripherals are best held as categories rather than as a list, and "
        "the classification that survives changing technology is by how data "
        "moves: a character device offers a stream with no addressable "
        "positions, a block device can be asked for block n directly -- which "
        "is what file systems and indexes depend on -- and a network device "
        "handles framed packets. Input devices divide by what they capture, "
        "and each family carries a characteristic problem: a key reports its "
        "position rather than a character, so layouts are software; image "
        "capture is sampling and quantisation, so detail below the resolution "
        "is gone; code readers need check digits because a misread yields a "
        "valid-looking wrong identifier rather than visible nonsense; and "
        "biometrics match by threshold, so false acceptances and rejections "
        "are inherent. On the output side the calculable property is the "
        "frame buffer -- width times height times bytes per pixel, and "
        "multiplied by the refresh rate it explains why graphics hardware "
        "carries its own memory. Printers divide by how the mark is made, "
        "with impact printers alone able to reach a second sheet and laser "
        "printers alone needing memory for a whole rendered page. Storage as "
        "a peripheral adds one property the Memory lesson did not need: "
        "removability, which is the only thing that makes offsite retention "
        "possible and the only answer to a fire, a theft or ransomware "
        "reaching everything mounted. And the selection criteria conflict by "
        "design, so an item asking which device is best without naming a "
        "priority is not answerable.",
        exam_notes=[
            desc(
                "Device items on Subject A are identification plus the "
                "occasional display or capacity calculation."
            ),
            ul([
                "Classifying a described device as character or block.",
                "Computing frame buffer size or refresh bandwidth.",
                "Choosing a printer technology for a stated requirement.",
                "Explaining why an identifier carries a check digit.",
                "Selecting a storage medium given a stated priority.",
                "Recognising why a connected backup drive is not offsite "
                "storage.",
            ]),
            desc(
                "On any display calculation, convert bits to bytes before "
                "multiplying and keep the units visible at every step. The "
                "distractors are almost always the same answer expressed in "
                "bits, or the pixel count taken as a byte count."
            ),
        ],
    ))

LESSONS = [LESSON_DEVICES]

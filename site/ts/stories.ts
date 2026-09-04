/** stories.ts — press and video coverage of the network's chapters and projects.
 *  The home page's photo strip and The Network's Stories section both render from this list.
 *  Every url was opened and checked before it went in; images are our own photos, never hotlinked. */
export type Story = {
  title: string;      // the piece's real headline
  outlet: string;     // who published it
  date: string;       // YYYY-MM-DD
  url: string;        // the piece itself
  image: string;      // our photo for the tile (site-relative)
  blurb: string;      // one plain sentence
  kind: "article" | "video";
  pos?: string;       // object-position for the tile crop
};

export const STORIES: Story[] = [
  { title: "Third annual Hacksgiving hackathon supports Milwaukee Domes Alliance", outlet: "MSOE News", date: "2025-11-25",
    url: "https://www.msoe.edu/about-msoe/news/details/third-annual-hacksgiving-hackathon-supports-milwaukee-domes-alliance/",
    image: "./public/web/group-photo.jpg", blurb: "Over 50 students in 12 teams built AI tools for the Domes. First place took $3,000.", kind: "article" },
  { title: "MSOE students use AI to create man-made glaciers", outlet: "MSOE News", date: "2025-10-01",
    url: "https://www.msoe.edu/about-msoe/news/details/msoe-students-use-ai-to-create-man-made-glaciers/",
    image: "./public/art/nilus.webp", pos: "50% 20%", blurb: "The club's research group built the models behind Nilus's ice stupas in Chile, then went to see them.", kind: "article" },
  { title: "Students create AI solutions for Brady Corp through Innovation Labs hackathon", outlet: "MSOE News", date: "2024-12-16",
    url: "https://www.msoe.edu/about-msoe/news/details/students-create-ai-solutions-for-brady-corp-through-innovation-labs-hackathon/",
    image: "./public/web/officer-innovation-lab.jpg", blurb: "Sixty MSOE and UWM students built image-based liquid-volume tools for Brady and presented for cash prizes.", kind: "article" },
  { title: "Hacksgiving 2024 supports Discovery World", outlet: "MSOE News", date: "2024-11-26",
    url: "https://www.msoe.edu/about-msoe/news/details/hacksgiving-2024-supports-discovery-world/",
    image: "./public/web/students-working.jpg", blurb: "Seventy students in ten teams built AI tools for Discovery World over a weekend. First prize $3,000.", kind: "article" },
  { title: "Mount Pleasant's John Cisler earns 3rd place in MSOE's Rosie Supercomputer Super Challenge", outlet: "Racine County Eye", date: "2024-05-21",
    url: "https://racinecountyeye.com/2024/05/21/john-cisler-msoe-supercomputer/",
    image: "./public/web/research-presentation.jpg", blurb: "Racine's paper on NourishNet, the club's food-price forecaster, taking third at the 2024 Super Challenge.", kind: "article" },
  { title: "Rosie Supercomputer Super Challenge 2024: NourishNet", outlet: "MSOE on Vimeo", date: "2024-05-15",
    url: "https://vimeo.com/946650435",
    image: "./public/art/tile-stage.jpg", blurb: "The NourishNet team presents food-price forecasting, filmed at the 2024 Super Challenge.", kind: "video" },
  { title: "Super challenge, super winners", outlet: "MSOE News", date: "2024-05-02",
    url: "https://www.msoe.edu/about-msoe/news/details/super-challenge-super-winners/",
    image: "./public/web/gpu-winners.jpg", blurb: "The 2024 Rosie Super Challenge results. NourishNet, eight students, took third.", kind: "article" },
  { title: "Inaugural Hacksgiving hackathon uses generative A.I. to support nonprofit clinic", outlet: "MSOE News", date: "2023-11-30",
    url: "https://www.msoe.edu/about-msoe/news/details/inaugural-hacksgiving-hackathon-uses-generative-a-i-to-support-nonprofit-clinic/",
    image: "./public/web/educator-hackathon.jpg", blurb: "The first Hacksgiving built patient-screening tools for Next Step Clinic. Team Skippy's chatbot won $3,000.", kind: "article" },
  { title: "Music to their ears: Students win Rosie Supercomputer Super Challenge for Music Transformers project", outlet: "MSOE News", date: "2023-04-24",
    url: "https://www.msoe.edu/about-msoe/news/details/music-to-their-ears-students-win-rosie-supercomputer-super-challenge-for-music-transformers-project/",
    image: "./public/web/maic-rosie-awards-check.jpg", pos: "50% 30%", blurb: "Jonny Keane and Michael Conner's music transformer took first place and $5,000.", kind: "article" },
  { title: "Milwaukee School of Engineering looks to become AI education leader through new campaign", outlet: "Spectrum News 1", date: "2025-04-17",
    url: "https://spectrumnews1.com/wi/milwaukee/news/2025/04/17/msoe-next-bold-step",
    image: "./public/web/supercomputer-tour.jpg", blurb: "Spectrum News on MSOE's AI push, with the club's president on the UN food-price forecasting project.", kind: "article" },
  { title: "MSOE celebrates five years of student and industry impact with Diercks Hall", outlet: "MSOE News", date: "2024-09-13",
    url: "https://www.msoe.edu/about-msoe/news/details/msoe-celebrates-five-years-of-student-and-industry-impact-with-diercks-hall-computer-science-ai-programs/",
    image: "./public/web/maic-projects-kickoff.jpg", blurb: "The five-year Diercks Hall story features the club's projects, NourishNet among them.", kind: "article" },
  { title: "Students compete at Midwest Instruction and Computing Symposium", outlet: "MSOE News", date: "2024-04-10",
    url: "https://www.msoe.edu/about-msoe/news/details/students-compete-at-midwest-instruction-and-computing-symposium/",
    image: "./public/art/tile-nourish.jpg", blurb: "The NourishNet paper won Best Student Paper at MICS 2024, all eight authors named.", kind: "article" },
];

/** Newest first. */
export const storiesByDate = (): Story[] => [...STORIES].sort((a, b) => (a.date < b.date ? 1 : -1));

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const fmtDate = (d: string): string => { const [y, m] = d.split("-").map(Number); return `${MONTHS[(m || 1) - 1]} ${y}`; };

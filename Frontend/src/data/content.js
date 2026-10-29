/**
 * Marketing copy for the public website (experiences, testimonials, team).
 * Rooms, prices, gallery photos and contact details are NOT here - they come from the API
 * (see services/publicApi.js and services/galleryApi.js).
 */
export const experiences = [
    { title: 'Private Dining', tag: 'Chef’s table', img: '/images/dark.webp', pos: '20% 70%' },
    { title: 'Spa & Wellness', tag: 'Restore', img: '/images/twin.webp', pos: '80% 30%' },
    { title: 'Rooftop Lounge', tag: 'Evenings', img: '/images/suite.webp', pos: '90% 40%' },
    { title: 'Concierge', tag: '24 / 7', img: '/images/deluxe.webp', pos: '60% 80%' },
];
export const testimonials = [
    { name: 'Ayesha Khan', from: 'Karachi, Pakistan', rating: 5, quote: 'Every detail felt considered — from the quiet arrival to the turndown. The most restful stay we have had.' },
    { name: 'Daniel Moore', from: 'London, UK', rating: 5, quote: 'The suite view at dusk is unforgettable, and the team anticipated everything before we asked.' },
    { name: 'Sara Al-Mansoori', from: 'Dubai, UAE', rating: 5, quote: 'Elegant without being stiff. Dining was exceptional and check-out took seconds.' },
];
export const team = [
    { name: 'Amelia Khan', role: 'Director of Hospitality', image: '/images/deluxe.webp', pos: '50% 40%', bio: 'Sets the service standard across every guest touchpoint, from arrival rituals to the smallest personal detail.' },
    { name: 'Daniel Moore', role: 'Executive Chef', image: '/images/dark.webp', pos: '30% 70%', bio: 'Shapes seasonal menus around local ingredients, precise technique and relaxed, memorable dining.' },
    { name: 'Sara Al-Mansoori', role: 'Guest Experience Lead', image: '/images/suite.webp', pos: '60% 50%', bio: 'Connects guests with the city through discreet concierge planning and seamless stays.' },
    { name: 'Hina Malik', role: 'General Manager', image: '/images/twin.webp', pos: '50% 50%', bio: 'Leads day-to-day operations so every department works as one quiet, well-rehearsed team.' },
    { name: 'Omar Farooq', role: 'Head of Front Office', image: '/images/deluxe.webp', pos: '80% 60%', bio: 'Makes arrival and departure effortless, with a memory for every returning guest.' },
    { name: 'Lena Fischer', role: 'Spa & Wellness Director', image: '/images/suite.webp', pos: '15% 50%', bio: 'Designs restorative rituals that turn a stay into time genuinely spent on yourself.' },
];

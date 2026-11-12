import * as cheerio from 'cheerio';
import { LinkedInProfile } from '../scraper-types';

export function extractLinkedInProfile(html: string): LinkedInProfile | null {
    const $ = cheerio.load(html);
    const profile: LinkedInProfile = {
        name: '',
        headline: '',
        location: '',
        experience: [],
        education: []
    };

    // 1. Try JSON-LD First (Most Reliable)
    try {
        const jsonLdScripts = $('script[type="application/ld+json"]');
        jsonLdScripts.each((i, el) => {
            const data = JSON.parse($(el).html() || '{}');
            const items = Array.isArray(data) ? data : [data];
            const person = items.find(item => item['@type'] === 'Person' || item['@type'] === 'ProfilePage');

            if (person) {
                profile.name = person.name || profile.name;
                profile.headline = person.jobTitle || person.description || profile.headline;
                profile.location = person.address?.addressLocality || profile.location;
                profile.image = person.image || profile.image;

                if (person.worksFor) {
                    const companies = Array.isArray(person.worksFor) ? person.worksFor : [person.worksFor];
                    profile.experience = companies.map((c: { name?: string }) => ({
                        title: person.jobTitle || 'Employee', // Schema often misses title per job
                        company: c.name || 'Unknown',
                    }));
                }
            }
        });
    } catch {
        // Ignore JSON parse errors
    }

    // 2. CSS Selectors (Fallback & Enrichment)
    // Public Profile Layout
    if (!profile.name) {
        profile.name = $('.top-card-layout__title').text().trim() ||
            $('h1.text-heading-xlarge').text().trim();
    }

    if (!profile.headline) {
        profile.headline = $('.top-card-layout__headline').text().trim() ||
            $('.text-body-medium').first().text().trim();
    }

    if (!profile.location) {
        profile.location = $('.top-card-layout__first-subline').text().trim() ||
            $('.text-body-small.inline.t-black--light.break-words').text().trim();
    }

    if (!profile.about) {
        profile.about = $('.core-section-container[data-section="summary"] .core-section-container__content').text().trim();
    }

    // Extract Connections
    const connectionText = $('.top-card-layout__second-subline').text().trim() ||
        $('.text-body-small').filter((i, el) => $(el).text().includes('connections')).text().trim();
    if (connectionText) {
        profile.connections = connectionText.replace(/connections?/, '').trim();
    }

    // Cleanup
    profile.name = profile.name.replace(/\n/g, ' ').replace(/\s+/g, ' ');
    profile.headline = profile.headline.replace(/\n/g, ' ').replace(/\s+/g, ' ');
    profile.location = profile.location.replace(/\n/g, ' ').replace(/\s+/g, ' ');

    return profile.name ? profile : null;
}

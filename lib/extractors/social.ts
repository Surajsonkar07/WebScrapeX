import * as cheerio from 'cheerio';
import { SocialMetadata } from '../scraper-types';

export function extractSocialData(html: string): SocialMetadata {
    const $ = cheerio.load(html);
    const social: SocialMetadata = {};

    // Open Graph
    social.ogTitle = $('meta[property="og:title"]').attr('content') || $('title').text();
    social.ogDescription = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content');
    social.ogImage = $('meta[property="og:image"]').attr('content');
    social.ogUrl = $('meta[property="og:url"]').attr('content');
    social.ogType = $('meta[property="og:type"]').attr('content');

    // Twitter Card
    social.twitterCard = $('meta[name="twitter:card"]').attr('content');
    social.twitterTitle = $('meta[name="twitter:title"]').attr('content') || social.ogTitle;
    social.twitterDescription = $('meta[name="twitter:description"]').attr('content') || social.ogDescription;
    social.twitterImage = $('meta[name="twitter:image"]').attr('content') || social.ogImage;
    social.twitterCreator = $('meta[name="twitter:creator"]').attr('content');

    // JSON-LD Extraction (for LinkedIn/Person profiles)
    try {
        const jsonLdScripts = $('script[type="application/ld+json"]');
        jsonLdScripts.each((i, el) => {
            try {
                const data = JSON.parse($(el).html() || '{}');
                // Handle Array or Single Object
                const items = Array.isArray(data) ? data : [data];

                const person = items.find(item => item['@type'] === 'Person' || item['@type'] === 'ProfilePage');
                if (person) {
                    // Prioritize JSON-LD data as it's more structured
                    if (person.name) social.ogTitle = person.name;
                    if (person.description) social.ogDescription = person.description;
                    if (person.jobTitle && person.worksFor) {
                        social.ogDescription = `${person.jobTitle} at ${person.worksFor.name}. ${social.ogDescription || ''}`;
                    }
                    if (person.image) social.ogImage = person.image;
                    if (person.url) social.ogUrl = person.url;

                    // Specific Person Data
                    if (person.jobTitle) social.twitterCreator = person.jobTitle; // Using twitterCreator field for Job Title temporarily
                }
            } catch {
                // Ignore parse errors
            }
        });
    } catch {
        // Ignore cheerio errors
    }

    return social;
}

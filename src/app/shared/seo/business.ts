// The business as search engines should see it: one place for the name,
// phone, hours and office addresses used in structured data. These must match
// the Google Business Profile word for word: Google cross-checks name, address
// and phone between the profile and the website, and mismatches weaken the
// local ranking ("builders near me", map results).
//
// TODO(client): confirm each office against the Google Business Profile and add
// its profile URL to `sameAs` (and `hasMap` per office) once shared.

export const SITE_URL = 'https://www.hunterproperty.in';

export interface Office {
  id: string;
  label: string;
  /** Neighbourhood, used to name the office. */
  area: string;
  streetAddress: string;
  locality: string;
  postalCode: string;
}

export const BUSINESS = {
  name: 'Hunter Property',
  legalName: 'Hunter Property Pvt Ltd',
  telephone: '+91-7550110784',
  email: 'info@hunterproperty.in',
  logo: `${SITE_URL}/assets/img/logo/logo.png`,
  // As published on the site header: Sunday to Friday, 8 AM to 10 PM.
  openingHours: {
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '08:00',
    closes: '22:00'
  },
  priceRange: '₹2,199 – ₹3,199 per sq ft',
  sameAs: [
    'https://www.linkedin.com/company/hunter-property/',
    'https://www.facebook.com/Hunterpropertypvtltd/',
    'https://www.instagram.com/hunterpropertyindia'
  ],
  offices: [
    { id: 'perambur', label: 'Head Office', area: 'Perambur', streetAddress: '31, Thillai Nayagam Pillai Main Street, Perambur', locality: 'Chennai', postalCode: '600011' },
    { id: 'sembiam', label: 'Branch Office', area: 'Sembiam', streetAddress: '12, Mohammadan Street, Sembiyan, Perambur', locality: 'Chennai', postalCode: '600011' },
    { id: 'royapettah', label: 'Branch Office', area: 'Royapettah', streetAddress: '61, Mir Bakshi Ali Street, Royapettah', locality: 'Chennai', postalCode: '600014' },
    { id: 'kolathur', label: 'Corporate Office', area: 'Kolathur', streetAddress: '9/2A, 4th Main Road, Thirupathi Nagar, Kolathur', locality: 'Chennai', postalCode: '600099' }
  ] as Office[]
};

/** Construction packages as published on the homepage pricing section. */
export const PACKAGES = [
  { name: 'Basic', pricePerSqft: 2199 },
  { name: 'Standard', pricePerSqft: 2399 },
  { name: 'Premium', pricePerSqft: 2699 },
  { name: 'Ultra Luxury', pricePerSqft: 3199 }
];

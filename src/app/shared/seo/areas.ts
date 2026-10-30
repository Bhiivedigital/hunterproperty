// Chennai localities we build in, for the /builders-in-chennai/ hub, the
// "Area at a glance" panel on each area guide and the area structured data.
//
// Each entry's slug is a guide under /home-construction/. The article itself
// (the part that makes every area page different) lives in the CMS; this table
// only carries the short facts shown beside it. A slug with no published guide
// is simply not linked: the hub and the nearby-area links only show areas the
// CMS actually returns, so adding an area here before its page is published
// never produces a broken link.

export type Zone = 'North Chennai' | 'Central Chennai' | 'West Chennai' | 'South Chennai & OMR' | 'Southern Suburbs';

export const ZONES: Zone[] = ['North Chennai', 'Central Chennai', 'West Chennai', 'South Chennai & OMR', 'Southern Suburbs'];

export interface Area {
  slug: string;
  name: string;
  zone: Zone;
  pincodes: string[];
  /** Who issues the building permit for a typical individual house here. */
  approvals: string;
  /** The one thing that shapes a build in this locality more than elsewhere. */
  keyConsideration: string;
  /** Office the site team works from. */
  servedFrom: 'perambur' | 'sembiam' | 'royapettah' | 'kolathur';
  nearby: string[];
}

const GCC = 'Greater Chennai Corporation (CMDA for larger buildings)';

export const AREAS: Area[] = [
  // --- North Chennai: closest to our Perambur, Sembiam and Kolathur offices
  { slug: 'best-builders-in-perambur', name: 'Perambur', zone: 'North Chennai', pincodes: ['600011', '600082'], approvals: GCC, keyConsideration: 'Narrow plots in dense older streets', servedFrom: 'perambur', nearby: ['builders-in-sembiam', 'builders-in-kolathur', 'builders-in-vyasarpadi', 'builders-in-ayanavaram'] },
  { slug: 'builders-in-sembiam', name: 'Sembiam', zone: 'North Chennai', pincodes: ['600011'], approvals: GCC, keyConsideration: 'Mixed residential and commercial zoning', servedFrom: 'sembiam', nearby: ['best-builders-in-perambur', 'builders-in-kolathur', 'builders-in-madhavaram'] },
  { slug: 'builders-in-kolathur', name: 'Kolathur', zone: 'North Chennai', pincodes: ['600099'], approvals: GCC, keyConsideration: 'Narrow lanes that limit machinery and material delivery', servedFrom: 'kolathur', nearby: ['builders-in-retteri', 'builders-in-villivakkam', 'builders-in-madhavaram', 'builders-in-sembiam'] },
  { slug: 'builders-in-retteri', name: 'Retteri', zone: 'North Chennai', pincodes: ['600099'], approvals: GCC, keyConsideration: 'Lake-edge plots: water table and title checks', servedFrom: 'kolathur', nearby: ['builders-in-kolathur', 'builders-in-madhavaram', 'builders-in-korattur'] },
  { slug: 'builders-in-madhavaram', name: 'Madhavaram', zone: 'North Chennai', pincodes: ['600060'], approvals: GCC, keyConsideration: 'Larger plots and newer layouts still available', servedFrom: 'kolathur', nearby: ['builders-in-retteri', 'builders-in-kolathur', 'builders-in-sembiam'] },
  { slug: 'builders-in-villivakkam', name: 'Villivakkam', zone: 'North Chennai', pincodes: ['600049'], approvals: GCC, keyConsideration: 'Renovate-or-rebuild decisions on older houses', servedFrom: 'kolathur', nearby: ['builders-in-kolathur', 'builders-in-anna-nagar', 'builders-in-ayanavaram', 'builders-in-korattur'] },
  { slug: 'builders-in-korattur', name: 'Korattur', zone: 'North Chennai', pincodes: ['600080'], approvals: GCC, keyConsideration: 'Lake proximity and older layout approvals', servedFrom: 'kolathur', nearby: ['builders-in-villivakkam', 'builders-in-ambattur', 'builders-in-retteri', 'builders-in-anna-nagar'] },
  { slug: 'builders-in-ayanavaram', name: 'Ayanavaram', zone: 'North Chennai', pincodes: ['600023'], approvals: GCC, keyConsideration: 'Established layouts with ageing housing stock', servedFrom: 'perambur', nearby: ['builders-in-purasawalkam', 'builders-in-villivakkam', 'best-builders-in-perambur', 'builders-in-anna-nagar'] },
  { slug: 'builders-in-purasawalkam', name: 'Purasawalkam', zone: 'North Chennai', pincodes: ['600007', '600084'], approvals: GCC, keyConsideration: 'Old streets, shared walls and tight access', servedFrom: 'perambur', nearby: ['builders-in-ayanavaram', 'builders-in-vyasarpadi', 'best-builders-in-perambur'] },
  { slug: 'builders-in-vyasarpadi', name: 'Vyasarpadi', zone: 'North Chennai', pincodes: ['600039'], approvals: GCC, keyConsideration: 'Getting more usable floor area from small plots', servedFrom: 'perambur', nearby: ['best-builders-in-perambur', 'builders-in-purasawalkam', 'builders-in-thiruvottiyur'] },
  { slug: 'builders-in-thiruvottiyur', name: 'Thiruvottiyur', zone: 'North Chennai', pincodes: ['600019'], approvals: GCC, keyConsideration: 'Coastal air: corrosion protection for steel and concrete', servedFrom: 'perambur', nearby: ['builders-in-vyasarpadi', 'builders-in-madhavaram'] },

  // --- Central Chennai
  { slug: 'builders-in-royapettah', name: 'Royapettah', zone: 'Central Chennai', pincodes: ['600014'], approvals: GCC, keyConsideration: 'Rebuilding on small, high-value central plots', servedFrom: 'royapettah', nearby: ['builders-in-mylapore', 'builders-in-t-nagar', 'builders-in-adyar'] },
  { slug: 'builders-in-mylapore', name: 'Mylapore', zone: 'Central Chennai', pincodes: ['600004'], approvals: GCC, keyConsideration: 'Old independent houses, heritage streets and joint development', servedFrom: 'royapettah', nearby: ['builders-in-royapettah', 'builders-in-adyar', 'builders-in-t-nagar'] },
  { slug: 'builders-in-t-nagar', name: 'T Nagar', zone: 'Central Chennai', pincodes: ['600017'], approvals: GCC, keyConsideration: 'Commercial pressure on residential streets and parking rules', servedFrom: 'royapettah', nearby: ['builders-in-kk-nagar', 'builders-in-royapettah', 'builders-in-mylapore'] },
  { slug: 'builders-in-kk-nagar', name: 'KK Nagar', zone: 'Central Chennai', pincodes: ['600078'], approvals: GCC, keyConsideration: 'Planned 1970s layouts ready for a second-generation rebuild', servedFrom: 'royapettah', nearby: ['builders-in-t-nagar', 'builders-in-virugambakkam', 'builders-in-valasaravakkam'] },
  { slug: 'builders-in-adyar', name: 'Adyar', zone: 'Central Chennai', pincodes: ['600020'], approvals: GCC, keyConsideration: 'River-side flood levels and premium specifications', servedFrom: 'royapettah', nearby: ['builders-in-mylapore', 'builders-in-velachery', 'builders-in-ecr'] },
  { slug: 'builders-in-anna-nagar', name: 'Anna Nagar', zone: 'Central Chennai', pincodes: ['600040', '600101', '600102'], approvals: GCC, keyConsideration: 'Redevelopment of large plots in a premium locality', servedFrom: 'kolathur', nearby: ['builders-in-mogappair', 'builders-in-villivakkam', 'builders-in-korattur', 'builders-in-ayanavaram'] },

  // --- West Chennai
  { slug: 'builders-in-mogappair', name: 'Mogappair', zone: 'West Chennai', pincodes: ['600037'], approvals: GCC, keyConsideration: 'Rebuilding 1980s houses in planned layouts', servedFrom: 'kolathur', nearby: ['builders-in-anna-nagar', 'builders-in-ambattur', 'builders-in-korattur'] },
  { slug: 'builders-in-ambattur', name: 'Ambattur', zone: 'West Chennai', pincodes: ['600053', '600058'], approvals: GCC, keyConsideration: 'Lake and industrial-estate surroundings: soil and drainage', servedFrom: 'kolathur', nearby: ['builders-in-mogappair', 'builders-in-avadi', 'builders-in-korattur'] },
  { slug: 'builders-in-avadi', name: 'Avadi', zone: 'West Chennai', pincodes: ['600054'], approvals: 'Avadi City Municipal Corporation (CMDA for larger buildings)', keyConsideration: 'Affordable larger plots; layout approval checks matter', servedFrom: 'kolathur', nearby: ['builders-in-ambattur', 'builders-in-poonamallee'] },
  { slug: 'builders-in-valasaravakkam', name: 'Valasaravakkam', zone: 'West Chennai', pincodes: ['600087'], approvals: GCC, keyConsideration: 'Dense residential streets with rising land values', servedFrom: 'royapettah', nearby: ['builders-in-virugambakkam', 'builders-in-porur', 'builders-in-kk-nagar'] },
  { slug: 'builders-in-virugambakkam', name: 'Virugambakkam', zone: 'West Chennai', pincodes: ['600092'], approvals: GCC, keyConsideration: 'Older houses on narrow plots with lane drainage issues', servedFrom: 'royapettah', nearby: ['builders-in-valasaravakkam', 'builders-in-kk-nagar', 'builders-in-porur'] },
  { slug: 'builders-in-porur', name: 'Porur', zone: 'West Chennai', pincodes: ['600116'], approvals: GCC, keyConsideration: 'A fast-growing suburb with plots near the lake', servedFrom: 'royapettah', nearby: ['builders-in-valasaravakkam', 'builders-in-poonamallee', 'builders-in-virugambakkam'] },
  { slug: 'builders-in-poonamallee', name: 'Poonamallee', zone: 'West Chennai', pincodes: ['600056'], approvals: 'Local body / CMDA (check whether the layout is approved)', keyConsideration: 'Open plots on the metro corridor; layout approval first', servedFrom: 'royapettah', nearby: ['builders-in-porur', 'builders-in-avadi'] },

  // --- South Chennai & the OMR IT corridor
  { slug: 'builders-in-velachery', name: 'Velachery', zone: 'South Chennai & OMR', pincodes: ['600042'], approvals: GCC, keyConsideration: 'Low-lying ground: plinth level and drainage first', servedFrom: 'royapettah', nearby: ['builders-in-madipakkam', 'builders-in-pallikaranai', 'builders-in-adyar', 'builders-in-perungudi'] },
  { slug: 'builders-in-madipakkam', name: 'Madipakkam', zone: 'South Chennai & OMR', pincodes: ['600091'], approvals: GCC, keyConsideration: 'Waterlogging-prone streets: raised plinth and sumps', servedFrom: 'royapettah', nearby: ['builders-in-velachery', 'builders-in-medavakkam', 'builders-in-pallikaranai'] },
  { slug: 'builders-in-pallikaranai', name: 'Pallikaranai', zone: 'South Chennai & OMR', pincodes: ['600100'], approvals: GCC, keyConsideration: 'Marshland edges: soil testing and foundation design', servedFrom: 'royapettah', nearby: ['builders-in-medavakkam', 'builders-in-velachery', 'builders-in-perungudi'] },
  { slug: 'builders-in-medavakkam', name: 'Medavakkam', zone: 'South Chennai & OMR', pincodes: ['600100'], approvals: GCC, keyConsideration: 'New layouts: verify approval and road access before buying', servedFrom: 'royapettah', nearby: ['builders-in-pallikaranai', 'builders-in-madipakkam', 'builders-in-sholinganallur', 'builders-in-selaiyur'] },
  { slug: 'builders-in-perungudi', name: 'Perungudi', zone: 'South Chennai & OMR', pincodes: ['600096'], approvals: GCC, keyConsideration: 'OMR land prices: building up rather than out', servedFrom: 'royapettah', nearby: ['builders-in-thoraipakkam', 'builders-in-velachery', 'builders-in-omr'] },
  { slug: 'builders-in-thoraipakkam', name: 'Thoraipakkam', zone: 'South Chennai & OMR', pincodes: ['600097'], approvals: GCC, keyConsideration: 'Rental-income homes for the IT corridor', servedFrom: 'royapettah', nearby: ['builders-in-perungudi', 'builders-in-sholinganallur', 'builders-in-omr'] },
  { slug: 'builders-in-sholinganallur', name: 'Sholinganallur', zone: 'South Chennai & OMR', pincodes: ['600119'], approvals: GCC, keyConsideration: 'High water table near the marsh and backwaters', servedFrom: 'royapettah', nearby: ['builders-in-thoraipakkam', 'builders-in-medavakkam', 'builders-in-omr', 'builders-in-ecr'] },
  { slug: 'builders-in-omr', name: 'OMR', zone: 'South Chennai & OMR', pincodes: ['600096', '600097', '600119', '603103'], approvals: 'Greater Chennai Corporation inside city limits; local body / CMDA further south', keyConsideration: 'A 45 km corridor: approvals change along the road', servedFrom: 'royapettah', nearby: ['builders-in-perungudi', 'builders-in-thoraipakkam', 'builders-in-sholinganallur', 'builders-in-ecr'] },
  { slug: 'builders-in-ecr', name: 'ECR', zone: 'South Chennai & OMR', pincodes: ['600041', '600115', '600119'], approvals: 'Greater Chennai Corporation / local body; CRZ rules near the shore', keyConsideration: 'Coastal zone rules, salt air and sandy soil', servedFrom: 'royapettah', nearby: ['builders-in-sholinganallur', 'builders-in-omr', 'builders-in-adyar'] },

  // --- Southern suburbs along the GST Road
  { slug: 'builders-in-chromepet', name: 'Chromepet', zone: 'Southern Suburbs', pincodes: ['600044'], approvals: 'Tambaram City Municipal Corporation (CMDA for larger buildings)', keyConsideration: 'Established GST Road suburb with older houses to rebuild', servedFrom: 'royapettah', nearby: ['builders-in-pallavaram', 'builders-in-tambaram', 'builders-in-selaiyur'] },
  { slug: 'builders-in-pallavaram', name: 'Pallavaram', zone: 'Southern Suburbs', pincodes: ['600043'], approvals: 'Tambaram City Municipal Corporation (CMDA for larger buildings)', keyConsideration: 'Rocky terrain and airport height limits', servedFrom: 'royapettah', nearby: ['builders-in-chromepet', 'builders-in-tambaram'] },
  { slug: 'builders-in-tambaram', name: 'Tambaram', zone: 'Southern Suburbs', pincodes: ['600045', '600059'], approvals: 'Tambaram City Municipal Corporation (CMDA for larger buildings)', keyConsideration: 'Approvals, plot checks and real build costs', servedFrom: 'royapettah', nearby: ['builders-in-chromepet', 'builders-in-selaiyur', 'builders-in-guduvanchery', 'builders-in-pallavaram'] },
  { slug: 'builders-in-selaiyur', name: 'Selaiyur', zone: 'Southern Suburbs', pincodes: ['600073'], approvals: 'Tambaram City Municipal Corporation (CMDA for larger buildings)', keyConsideration: 'Lake-adjacent layouts and quickly growing streets', servedFrom: 'royapettah', nearby: ['builders-in-tambaram', 'builders-in-medavakkam', 'builders-in-chromepet'] },
  { slug: 'builders-in-guduvanchery', name: 'Guduvanchery', zone: 'Southern Suburbs', pincodes: ['603202'], approvals: 'Local body with DTCP or CMDA layout approval (check which applies)', keyConsideration: 'Open plots: confirm layout approval before anything else', servedFrom: 'royapettah', nearby: ['builders-in-tambaram', 'builders-in-selaiyur'] }
];

export const AREAS_BY_SLUG = new Map(AREAS.map(area => [area.slug, area]));

/** The category every area guide lives under. */
export const AREA_CATEGORY_SLUG = 'home-construction';

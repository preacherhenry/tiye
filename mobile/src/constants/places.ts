
export interface Place {
    name: string;
    category?: 'school' | 'shop' | 'lodge' | 'church' | 'restaurant' | 'hospital' | 'other';
    latitude?: number;
    longitude?: number;
}

export const CHIRUNDU_PLACES: Place[] = [
    { name: "Grants Night Spot", category: 'restaurant' },
    { name: "Seventh Day Adventist, Chirundu North", category: 'church' },
    { name: "J&L Private Safari", category: 'lodge' },
    { name: "Shamil Academy", category: 'school' },
    { name: "Sidu Bakery", category: 'shop' },
    { name: "Chirundu Border Post", category: 'other' },
    { name: "Chirundu District Hospital", category: 'hospital' },
    { name: "Lusaka Road Checkpoint", category: 'other' },
    { name: "Zambezi River Lodge", category: 'lodge' },
    { name: "Chirundu Primary School", category: 'school' },
    { name: "Mtendele Market", category: 'shop' },
    { name: "Chirundu Police Station", category: 'other' },
    { name: "Puma Filling Station", category: 'shop' },
    { name: "Kanyemba Lodge", category: 'lodge' },
    { name: "Eagle's Rest", category: 'lodge' },
    { name: "Chirundu High School", category: 'school' },
    { name: "Tiger Fishing Camp", category: 'lodge' },
    { name: "Chirundu Guest House", category: 'lodge' },
    { name: "Siavonga Turn-off", category: 'other' },
];

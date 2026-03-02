
export interface Place {
    name: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    category?: string;
    area?: string;
}

export const CHIRUNDU_PLACES: Place[] = [
    { name: "Grants Night Spot", description: "Night Club / Restaurant" },
    { name: "Seventh Day Adventist", description: "Church • Chirundu North" },
    { name: "J&L Private Safari", description: "Lodge / Safari" },
    { name: "Shamil Academy", description: "School" },
    { name: "Sidu Bakery", description: "Bakery / Shop" },
    { name: "Chirundu Border Post", description: "Border Control / Government" },
    { name: "Chirundu District Hospital", description: "Hospital / Medical" },
    { name: "Lusaka Road Checkpoint", description: "Police / Roadblock" },
    { name: "Zambezi River Lodge", description: "Lodge" },
    { name: "Chirundu Primary School", description: "School" },
    { name: "Mtendele Market", description: "Market / Shopping" },
    { name: "Chirundu Police Station", description: "Government / Security" },
    { name: "Puma Filling Station", description: "Fuel / Shop" },
    { name: "Kanyemba Lodge", description: "Lodge" },
    { name: "Eagle's Rest", description: "Resort" },
    { name: "Chirundu High School", description: "School" },
    { name: "Tiger Fishing Camp", description: "Lodge / Fishing" },
    { name: "Chirundu Guest House", description: "Lodge" },
    { name: "Siavonga Turn-off", description: "Major Junction" },
    { name: "Kapila Guesthouse", description: "Lodge" },
    { name: "Post Office", description: "Government" },
];

export interface Bid {
    amount: number;
    playerId: string;
    isPass: boolean;
    isHonors: boolean;  // Whether this is an "honors" bid (>18 for 3p, >20 for 4p)
    timestamp: number;  // For ordering
} 
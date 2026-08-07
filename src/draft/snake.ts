import type { Pick } from "../types";

export function toSlot(pickNumber: number, managerCount: number): { round: number; managerIndex: number } {
    const round = Math.floor(pickNumber / managerCount);
    const isOddRound = round % 2 === 1;
    let managerIndex = pickNumber % managerCount;
    if (isOddRound) {
        // Account for snake draft, reverse order on odd rounds
        // 0 - indexed of coarse!
        managerIndex = managerCount - 1 - managerIndex;
    }
    return { round, managerIndex };
}

export function toPickNumber(round: number, managerIndex: number, managerCount: number): number {
    const isOddRound = round % 2 === 1;
    const column = isOddRound ? managerCount - 1 - managerIndex : managerIndex;
    return (round * managerCount) + column;
}

export function  getCurrentSlot(picks: (Pick | null)[]): number | null {
    const slot = picks.findIndex((p) => p === null);
    if (slot === -1) {
        return null;
    }
    return slot;
}

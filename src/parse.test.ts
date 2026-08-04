import { expect, test, describe } from 'vitest';
import { parseRows } from './parse';
import { createPlayerId } from './types';

const HEADER = `"RK",TIERS,"PLAYER NAME",TEAM,"POS","BYE WEEK","UPSIDE ","BUST ","SOS SEASON","ECR VS. ADP"`;

/** Joins rows onto the standard header without leaking indentation into the data. */
const csv = (...rows: string[]) => [HEADER, ...rows].join('\n');

describe('parseRows', () => {
  test('parses a standard row', () => {
    const { players, errors } = parseRows(
      csv(`"4",1,"Bijan Robinson",ATL,"RB2","11","up","bust","2 out of 5 stars","-2"`)
    );

    expect(errors).toEqual([]);
    expect(players).toEqual([
      {
        id: createPlayerId('Bijan Robinson', 'ATL', 'RB'),
        name: 'Bijan Robinson',
        searchName: 'bijan robinson',
        rank: 4,
        tier: 1,
        position: 'RB',
        positionRank: 2,
        team: 'ATL',
        byeWeek: 11,
      },
    ]);
  });

  test('normalizes apostrophes', () => {
    const { players } = parseRows(
      csv(`"1",1,"Ja'Marr Chase",CIN,"WR1","6","up","bust","4 out of 5 stars","+2"`)
    );
    expect(players[0]?.searchName).toBe('jamarr chase');
    expect(players[0]?.name).toBe("Ja'Marr Chase");
  });

  test('normalizes suffixes and periods', () => {
    const { players } = parseRows(
      csv(
        `"12",3,"Marvin Harrison Jr.",ARI,"WR8","8","up","bust","3 out of 5 stars","0"`,
        `"40",7,"A.J. Brown",PHI,"WR20","9","up","bust","3 out of 5 stars","0"`
      )
    );
    expect(players.map((p) => p.searchName)).toEqual(['marvin harrison', 'aj brown']);
  });

  test('parses a DST row', () => {
    const { players, errors } = parseRows(
      csv(`"154",9,"Houston Texans",HOU,"DST1","8","Coach Upside rating–No rating available","Coach Bust rating–No rating available","2 out of 5 stars","-49"`)
    );
    expect(errors).toEqual([]);
    expect(players[0]?.position).toBe('DST');
    expect(players[0]?.positionRank).toEqual(1);
  });

  test('sorts by overall rank regardless of file order', () => {
    const { players } = parseRows(
      csv(
        `"9",2,"Puka Nacua",LAR,"WR5","8","up","bust","3 out of 5 stars","0"`,
        `"2",1,"Bijan Robinson",ATL,"RB1","5","up","bust","3 out of 5 stars","0"`
      )
    );
    expect(players.map((p) => p.rank)).toEqual([2, 9]);
  });

  test('rejects bad rows without dropping good ones', () => {
    const { players, errors } = parseRows(
      csv(
        `"1",1,"Ja'Marr Chase",CIN,"WR1","6","up","bust","4 out of 5 stars","+2"`,
        `"nope",1,"Broken Rank",CIN,"WR2","6","up","bust","x","0"`,
        `"3",1,"No Team",XXX,"WR3","6","up","bust","x","0"`,
        `"4",1,"Bad Pos",CIN,"LB1","6","up","bust","x","0"`
      )
    );

    expect(players).toHaveLength(1);
    expect(errors).toHaveLength(3);
    expect(errors.map((e) => e.row)).toEqual([3, 4, 5]);
    expect(errors[0]?.reason).toContain('bad rank');
  });

  test('generates distinct ids for same-name players at different positions', () => {
    const { players } = parseRows(
      csv(
        `"30",5,"Josh Allen",BUF,"QB1","7","up","bust","x","0"`,
        `"31",5,"Josh Allen",JAX,"QB30","8","up","bust","x","0"`
      )
    );
    expect(players[0]?.id).not.toBe(players[1]?.id);
  });
});

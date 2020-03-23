def generate_bingo_sheets(tracks: List[Track]) -> BingoSheet:
    print('Generating bingo sheets')
bingo_sheets = set()
for i in range(0, NUMBER_OF_SHEETS):
bingo_sheets.add(tuple(random.sample(tracks, TRACKS_PER_SHEET)))

return bingo_sheets
const TILES = {
    BLANK: 33,
    WALL: {
        TOP_LEFT: 0,
        TOP_RIGHT: 2,
        BOTTOM_RIGHT: 24,
        BOTTOM_LEFT: 22,
        TOP: [{ index: 1, weight: 4 }, { index: [25], weight: 1 }],
        LEFT: [{ index: 11, weight: 4 }, { index: [26], weight: 1 }],
        RIGHT: [{ index: 13, weight: 4 }, { index: [27], weight: 1 }],
        BOTTOM: [{ index: 23, weight: 4 }, { index: [28], weight: 1 }]
    },
    FLOOR: [{ index: 12, weight: 6 }, { index: [3, 4, 6, 14, 15, 16, 17], weight: 1 }],
    DOOR: {
        TOP: [1, 12, 1],
        LEFT: [
            [11],
            [12],
            [11]
        ],
        BOTTOM: [23, 12, 23],
        RIGHT: [
            [13],
            [12],
            [13]
        ]
    },
    CHEST: [30],
    STAIRS: [32],
    OBSTACLE: [29]
}
let LevelEstimator = {
    b0Att: 1,
    b0Rel: 1,
    fs: 1000
};

let Compressor = {
    threshold: -20,
    ratio: 1,
    attack: 10/1000,
    release: 100/1000,
    knee: 10,
    bias: 0
};

let name = LevelEstimator;
console.log(name);

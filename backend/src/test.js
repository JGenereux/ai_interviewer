function arraysEqual(a, b) { return JSON.stringify(a) === JSON.stringify(b); } function throwError() { throw new Error('Test Failed!'); }
function InsertInterval(intervals, newInterval) {}
arraysEqual(InsertInterval([[1,3],[6,9]], [2,5]), [[1,5],[6,9]]) || throwError()
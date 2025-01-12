olddependencies=[1,2,3]
dependencies=[1,2,3,4]

console.log(dependencies.some((dep, i) => dep !== olddependencies[i]));
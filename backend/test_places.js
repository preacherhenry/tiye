const fetch = require('node-fetch');

async function test() {
    try {
        const res = await fetch('http://localhost:5000/places/search?q=Lusaka');
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

test();

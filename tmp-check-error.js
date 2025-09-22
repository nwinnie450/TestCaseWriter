const fetch = require('node-fetch');

(async () => {
  try {
    const res = await fetch('http://localhost:3010/api/run-details/cmftanhir000ko36cu5hn659l');
    const text = await res.text();
    const marker = '__NEXT_DATA__" type="application/json">';
    const start = text.indexOf(marker);
    if (start !== -1) {
      const end = text.indexOf('</script>', start);
      const json = text.slice(start + marker.length, end);
      const data = JSON.parse(json);
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(text.slice(0, 200));
    }
  } catch (err) {
    console.error(err);
  }
})();

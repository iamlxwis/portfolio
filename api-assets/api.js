const endpoints = [
  {id:"uuid",category:"utilities",method:"GET",path:"/api/v1/utils/uuid",title:"Generate UUID",description:"Generate a random UUID v4.",params:[],enabled:true,example:{success:true,data:{uuid:"550e8400-e29b-41d4-a716-446655440000"}}},
  {id:"random",category:"utilities",method:"GET",path:"/api/v1/utils/random",title:"Random number",description:"Generate an integer within a range.",params:[{name:"min",type:"number",required:false,default:"1"},{name:"max",type:"number",required:false,default:"100"}],enabled:true,example:{success:true,data:{min:1,max:100,number:42}}},
  {id:"password",category:"utilities",method:"GET",path:"/api/v1/utils/password",title:"Password generator",description:"Generate a random password between 8 and 64 characters.",params:[{name:"length",type:"number",required:false,default:"16"}],enabled:true,example:{success:true,data:{password:"example-only",length:16}}},
  {id:"timestamp",category:"utilities",method:"GET",path:"/api/v1/utils/timestamp",title:"Timestamp converter",description:"Convert a date or timestamp to ISO and Unix formats.",params:[{name:"value",type:"text",required:false,default:"Current date"}],enabled:true,example:{success:true,data:{iso:"2026-01-01T00:00:00.000Z",unixSeconds:1767225600,unixMilliseconds:1767225600000}}},
  {id:"qr",category:"utilities",method:"GET",path:"/api/v1/utils/qr",title:"QR code",description:"Generate a QR code data URL from text or a URL.",params:[{name:"text",type:"text",required:true}],enabled:true,example:{success:true,data:{dataUrl:"data:image/png;base64,...",format:"png",width:320,height:320}}},
  {id:"count",category:"text",method:"POST",path:"/api/v1/text/count",title:"Text counter",description:"Count characters, words, and lines.",params:[{name:"text",type:"textarea",required:true}],enabled:true,example:{success:true,data:{characters:12,charactersWithoutSpaces:10,words:2,lines:1}}},
  {id:"case",category:"text",method:"POST",path:"/api/v1/text/case",title:"Case converter",description:"Convert text to upper, lower, title, or sentence case.",params:[{name:"text",type:"textarea",required:true},{name:"mode",type:"select",required:false,default:"upper",options:["upper","lower","title","sentence"]}],enabled:true,example:{success:true,data:{mode:"upper",result:"HELLO WORLD"}}},
  {id:"slug",category:"text",method:"POST",path:"/api/v1/text/slug",title:"Slug generator",description:"Turn text into a URL-friendly slug.",params:[{name:"text",type:"textarea",required:true}],enabled:true,example:{success:true,data:{slug:"hello-world"}}},
  {id:"reverse",category:"text",method:"POST",path:"/api/v1/text/reverse",title:"Reverse text",description:"Reverse a string while keeping Unicode characters intact.",params:[{name:"text",type:"textarea",required:true}],enabled:true,example:{success:true,data:{result:"dlrow olleh"}}},
  {id:"encode",category:"text",method:"POST",path:"/api/v1/text/encode",title:"Text encoder",description:"Encode or decode URL components and Base64.",params:[{name:"text",type:"textarea",required:true},{name:"mode",type:"select",required:false,default:"url-encode",options:["url-encode","url-decode","base64-encode","base64-decode"]}],enabled:true,example:{success:true,data:{mode:"url-encode",result:"hello%20world"}}},
  {id:"lorem",category:"text",method:"POST",path:"/api/v1/text/lorem",title:"Lorem ipsum",description:"Generate one to ten placeholder paragraphs.",params:[{name:"count",type:"number",required:false,default:"1"}],enabled:true,example:{success:true,data:{paragraphs:["Lorem ipsum dolor sit amet..."]}}},
  {id:"format",category:"developer",method:"POST",path:"/api/v1/dev/json/format",title:"JSON formatter",description:"Validate and pretty-print JSON text.",params:[{name:"json",type:"textarea",required:true}],enabled:true,example:{success:true,data:{result:'{\n  "hello": "world"\n}'}}},
  {id:"validate",category:"developer",method:"POST",path:"/api/v1/dev/json/validate",title:"JSON validator",description:"Check whether supplied JSON is valid.",params:[{name:"json",type:"textarea",required:true}],enabled:true,example:{success:true,data:{valid:true}}},
  {id:"hash",category:"developer",method:"POST",path:"/api/v1/dev/hash",title:"Text hash",description:"Create a SHA-256, SHA-384, or SHA-512 digest.",params:[{name:"text",type:"textarea",required:true},{name:"algorithm",type:"select",required:false,default:"sha256",options:["sha256","sha384","sha512"]}],enabled:true,example:{success:true,data:{algorithm:"sha256",hash:"...hex digest..."}}},
  {id:"joke",category:"fun",method:"GET",path:"/api/v1/fun/joke",title:"Random joke",description:"Return a joke from the built-in collection.",params:[],enabled:true,example:{success:true,data:{joke:"Why do programmers prefer dark mode? Because light attracts bugs."}}},
  {id:"fact",category:"fun",method:"GET",path:"/api/v1/fun/fact",title:"Random fact",description:"Return a fact from the built-in collection.",params:[],enabled:true,example:{success:true,data:{fact:"Octopuses have three hearts."}}},
  {id:"quote",category:"fun",method:"GET",path:"/api/v1/fun/quote",title:"Random quote",description:"Return a quote and its attributed author.",params:[],enabled:true,example:{success:true,data:{text:"Well done is better than well said.",author:"Benjamin Franklin"}}},
  {id:"images",category:"images",method:"POST",path:"/api/v1/images/resize",title:"Image tools",description:"Image endpoints are planned but not enabled in the first release.",params:[],enabled:false,example:{success:false,error:{code:"FEATURE_NOT_READY",message:"Image endpoints are planned but not enabled yet."}}},
  {id:"ai",category:"ai",method:"POST",path:"/api/v1/ai/chat",title:"AI chat",description:"AI endpoints need a configured provider and are not enabled yet.",params:[],enabled:false,example:{success:false,error:{code:"FEATURE_NOT_READY",message:"AI endpoints are planned but not enabled yet."}}}
];
const list = document.getElementById("endpoint-list");
const detail = document.getElementById("endpoint-detail");
const search = document.getElementById("search");
const playSelect = document.getElementById("play-endpoint");
const fields = document.getElementById("request-fields");
const responseOutput = document.querySelector("#response-output code");
const responseStatus = document.getElementById("response-status");
let category = "all";
let selectedId = "uuid";

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
function methodClass(method) { return method.toLowerCase(); }
function visibleEndpoints() {
  const query = search.value.trim().toLowerCase();
  return endpoints.filter(item => (category === "all" || item.category === category) &&
    (item.title + " " + item.path + " " + item.description + " " + item.category).toLowerCase().includes(query));
}
function renderList() {
  const items = visibleEndpoints();
  list.innerHTML = items.length ? items.map(item => `<button class="endpoint-item ${item.id===selectedId?"selected":""}" data-id="${item.id}"><span class="endpoint-top"><span class="method ${methodClass(item.method)}">${item.method}</span><span class="endpoint-path">${escapeHtml(item.path)}</span></span><span class="endpoint-desc">${escapeHtml(item.description)}${item.enabled?"":" · planned"}</span></button>`).join("") : '<div class="empty">No endpoints match your search.</div>';
  list.querySelectorAll("[data-id]").forEach(button => button.addEventListener("click", () => selectEndpoint(button.dataset.id)));
}
function renderDetail(item) {
  const params = item.params.length ? `<div class="detail-label">Parameters</div><p>${item.params.map(param => `<code>${escapeHtml(param.name)}</code> — ${escapeHtml(param.type)}${param.required?" · required":""}${param.default?" · default "+escapeHtml(param.default):""}`).join("<br>")}</p>` : '<div class="detail-label">Parameters</div><p class="muted">No parameters required.</p>';
  detail.innerHTML = `<p class="eyebrow">${escapeHtml(item.category)} / ${item.enabled?"AVAILABLE":"PLANNED"}</p><h3>${escapeHtml(item.title)}</h3><p class="muted">${escapeHtml(item.description)}</p><div class="detail-path">${item.method} ${escapeHtml(item.path)}</div>${params}<div class="detail-label">Example response</div><pre>${escapeHtml(JSON.stringify(item.example,null,2))}</pre><p><button class="button" id="use-endpoint" type="button">Try this endpoint ↘</button></p>`;
  document.getElementById("use-endpoint").addEventListener("click", () => {
    playSelect.value = item.id;
    renderFields();
    location.hash = "playground";
  });
}
function selectEndpoint(id) {
  selectedId = id;
  const item = endpoints.find(endpoint => endpoint.id === id);
  if (!item) return;
  renderList();
  renderDetail(item);
}
function renderFields() {
  const item = endpoints.find(endpoint => endpoint.id === playSelect.value) || endpoints[0];
  fields.innerHTML = item.params.map(param => {
    const id = "field-" + param.name;
    let input;
    if (param.type === "textarea") input = `<textarea class="field-textarea" id="${id}" name="${param.name}" ${param.required?"required":""} placeholder="${param.name==="json"?"Paste JSON here...":"Enter "+param.name+"..."}></textarea>`;
    else if (param.type === "select") input = `<select class="field-select" id="${id}" name="${param.name}">${param.options.map(option => `<option value="${option}" ${option===param.default?"selected":""}>${option}</option>`).join("")}</select>`;
    else input = `<input class="field-input" id="${id}" name="${param.name}" type="${param.type==="number"?"number":"text"}" ${param.default? `value="${escapeHtml(param.default==="Current date"?"":param.default)}"`:""} ${param.required?"required":""} placeholder="${param.default==="Current date"?"Leave empty for now":""}>`;
    return `<label for="${id}">${escapeHtml(param.name)} ${param.required?'<span class="muted">(required)</span>':'<span class="muted">(optional)</span>'}</label>${input}`;
  }).join("");
  document.getElementById("run-request").disabled = !item.enabled;
  document.getElementById("run-request").style.opacity = item.enabled ? "1" : ".45";
  if (!item.enabled) {
    responseOutput.textContent = JSON.stringify(item.example,null,2);
    responseStatus.textContent = "NOT ENABLED";
  } else {
    responseOutput.textContent = "Ready to send request.";
    responseStatus.textContent = "WAITING";
  }
  updateExample(item);
}
function updateExample(item) {
  const method = item.method === "GET" ? "" : `, {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ text: "Hello world" })\n}`;
  document.getElementById("example-code").textContent = `fetch("https://lxwis.site${item.path}"${method})\n  .then(response => response.json())\n  .then(result => console.log(result));`;
}
async function runRequest() {
  const item = endpoints.find(endpoint => endpoint.id === playSelect.value);
  if (!item || !item.enabled) return;
  const button = document.getElementById("run-request");
  const params = {};
  item.params.forEach(param => {
    const element = document.getElementById("field-" + param.name);
    if (element && element.value !== "") params[param.name] = param.type === "number" ? Number(element.value) : element.value;
  });
  const url = new URL(item.path, location.origin);
  const options = { method: item.method, headers: {} };
  if (item.method === "GET") Object.entries(params).forEach(([key,value]) => url.searchParams.set(key,String(value)));
  else { options.headers["Content-Type"] = "application/json"; options.body = JSON.stringify(params); }
  button.disabled = true;
  button.textContent = "Sending...";
  responseStatus.textContent = "REQUESTING";
  responseOutput.textContent = "Waiting for the API response...";
  try {
    const response = await fetch(url,options);
    const body = await response.json();
    responseStatus.textContent = String(response.status) + (response.ok ? " OK" : " ERROR");
    responseOutput.textContent = JSON.stringify(body,null,2);
  } catch (error) {
    responseStatus.textContent = "NETWORK ERROR";
    responseOutput.textContent = JSON.stringify({success:false,error:{code:"NETWORK_ERROR",message:"Could not reach the API. Check the deployment and try again."}},null,2);
  } finally {
    button.disabled = false;
    button.innerHTML = 'Send request <span>↗</span>';
  }
}
document.getElementById("filters").addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  category = button.dataset.category;
  document.querySelectorAll(".filter").forEach(item => item.classList.toggle("active",item===button));
  renderList();
});
search.addEventListener("input",renderList);
playSelect.innerHTML = endpoints.map(item => `<option value="${item.id}">${item.method} · ${item.title}${item.enabled?"":" (planned)"}</option>`).join("");
playSelect.addEventListener("change",renderFields);
document.getElementById("run-request").addEventListener("click",runRequest);
document.getElementById("copy-response").addEventListener("click",async () => {
  try { await navigator.clipboard.writeText(responseOutput.textContent); document.getElementById("copy-response").textContent="Copied"; }
  catch { document.getElementById("copy-response").textContent="Copy unavailable"; }
});
document.getElementById("copy-example").addEventListener("click",async () => {
  try { await navigator.clipboard.writeText(document.getElementById("example-code").textContent); document.getElementById("copy-example").textContent="Copied"; }
  catch { document.getElementById("copy-example").textContent="Copy unavailable"; }
});
search.addEventListener("keydown",event => { if(event.key==="Escape") { search.value=""; renderList(); } });
document.addEventListener("keydown",event => {
  if (event.key === "/" && !["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName)) { event.preventDefault(); search.focus(); }
});
renderList();
selectEndpoint(selectedId);
renderFields();

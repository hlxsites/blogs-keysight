export default async function decorate(block) {
  const a = block.querySelector('a');
  if (a) {
    const src = a.href;
    block.innerHTML = `
            <object data="${src}" type="application/pdf">
                <div>No online PDF viewer installed</div>
            </object>
            <p class="button-container"><a href="${src}" title="Download the PDF" class="button primary">Download the PDF</a></p>
    `;
  } else {
    block.classList.add('hidden');
  }
}

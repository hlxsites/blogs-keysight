export default async function decorate(block) {
  const url = new URL(window.location);
  const params = url.searchParams;
  const q = params.get('q') || '';

  block.innerHTML = `
    <input type="text"  id="header-search-text" placeholder="Search Blogs" name="term" value="${q}" autocomplete="off" />
    <button class="button secondary" id="header-search-submit">Search Blogs</button>
  `;

  const input = block.querySelector('#header-search-text');
  const execSearch = () => {
    const term = input.value;
    if (term) {
      window.location = `/blogs/search?q=${encodeURIComponent(term)}`;
    }
  };
  block.querySelector('#header-search-submit').addEventListener('click', execSearch);
  input.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      execSearch();
    }
  });
}

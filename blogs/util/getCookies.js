const getCookie = (name) => {
  if (typeof name !== 'string' || name === '') {
    throw new Error('The name parameter must be a non-empty string');
  }
  const value = `;${document.cookie}`;
  const parts = value.split(`;${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(';').shift();
  }
  return null;
};

export default getCookie;

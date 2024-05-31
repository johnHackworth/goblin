export const getFeatures = () => {
  const experimentalFeatures = localStorage.getItem('experimental');
  if( experimentalFeatures ) {
    return JSON.parse( experimentalFeatures )
  }
  return {}
}


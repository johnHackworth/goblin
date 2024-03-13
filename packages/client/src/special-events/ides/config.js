export default {
  isActive: () => {
    const today = new Date();
    return today.getMonth() === 2 && today.getDate() >= 13  && today.getDate() <= 15 ;
  }
}
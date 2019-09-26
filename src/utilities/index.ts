let id = 0;
function getID() {
  return String(id++);
}

function mapNumber(
  value: number,
  lowA: number,
  highA: number,
  lowB: number,
  highB: number
) {
  return ((value - lowA) / (highA - lowA)) * (highB - lowB) + lowB;
}

export { getID, mapNumber };

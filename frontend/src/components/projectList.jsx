// ./components/projectList.jsx

function ListItem({ title, description }) {
  return (
    <li className="list-item">
      <h3>{title}</h3>
      <p>{description}</p>
    </li>
  );
}

export default ListItem;
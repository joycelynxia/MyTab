import { useNavigate } from "react-router-dom"
import { v4 as uuidv4 } from "uuid";

const CreateGroupButton : React.FC = () => {
  const nav = useNavigate();

  const createGroup = () => {
    console.log('creating new group');
    const newGroupId = uuidv4();
    nav(`/groups/${newGroupId}}`)
  }
  
  return (
    <button onClick={createGroup}>create a new group</button>
  )
}

export default CreateGroupButton;
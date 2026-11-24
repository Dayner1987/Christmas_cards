import GroupChat from '../../components/group/GroupChat';
import GroupTree from '../../components/group/GroupTree';
import type {RoomProps} from '../../components/group/GroupChat';
export {GroupChat,GroupTree};
export default function GroupRoom(props:RoomProps){return <div className="guest-group-room"><GroupChat {...props}/><GroupTree {...props}/></div>;}

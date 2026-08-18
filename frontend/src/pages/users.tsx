import { useEffect } from 'react';
import { useUsers } from '../hooks/user.hook';

const Users = () => {
  const {
    users,
    loading,
    error,
    fetchUsers,
  } = useUsers();

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return <p>Cargando usuarios...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (users.length === 0) {
    return <p>No hay usuarios registrados.</p>;
  }

  const user = users[0];

  return (
    <div>
      <h1>Usuario obtenido desde la API</h1>

      <p>
        <strong>ID:</strong> {user.id_users}
      </p>

      <p>
        <strong>Usuario:</strong> {user.username}
      </p>

      <p>
        <strong>Email:</strong> {user.email}
      </p>

      <p>
        <strong>Nombre:</strong>{' '}
        {user.first_name} {user.last_name}
      </p>

      <p>
        <strong>Teléfono:</strong> {user.phone}
      </p>

      <p>
        <strong>Estado:</strong> {user.status}
      </p>
    </div>
  );
};

export default Users;
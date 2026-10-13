// src/hooks/useCommunityUsers.ts

import {
  useEffect,
  useState,
} from 'react';

import {
  getCommunityUsers,
} from '../api/community-users';

import type {
  CommunityUser,
} from '../api/community-users';

import {
  getApiError,
} from '../api/http';

export function useCommunityUsers(
  groupId?: string,
) {
  const [users, setUsers] = useState<CommunityUser[]>([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;

    if (!groupId) {
      setUsers([]);
      setError(null);
      setLoading(false);
      return;
    }

    setUsers([]);
    setLoading(true);
    setError(null);

    getCommunityUsers(groupId)
      .then((data) => {
        if (active) {
          setUsers(data);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(getApiError(cause));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [groupId, version]);

  const refreshUsers = () => {
    setVersion((current) => current + 1);
  };

  return {
    users,
    loading,
    error,
    totalUsers: users.length,
    refreshUsers,
  };
}

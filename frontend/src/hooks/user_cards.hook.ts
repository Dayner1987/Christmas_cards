import { useState } from 'react';

import {
  cancelUserCard as cancelUserCardRequest,
  createUserCard as createUserCardRequest,
  getReceivedUserCards,
  getSentUserCards,
  getUserCardById,
  markUserCardAsRead as markUserCardAsReadRequest,
  sendUserCard as sendUserCardRequest,
  updateUserCard as updateUserCardRequest,
} from '../api/user_cards';

import type {
  CreateUserCard,
  UpdateUserCard,
  UserCard,
} from '../types/user_cards.schema';

export const useUserCards = () => {
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [userCard, setUserCard] = useState<UserCard | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => {
    setError(null);
  };

  const handleError = (
    error: unknown,
    defaultMessage: string,
  ) => {
    const message =
      error instanceof Error
        ? error.message
        : defaultMessage;

    setError(message);
    throw error;
  };

  const fetchSentUserCards = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getSentUserCards();
      setUserCards(response);

      return response;
    } catch (error) {
      handleError(
        error,
        'No se pudieron obtener las tarjetas enviadas',
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchReceivedUserCards = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getReceivedUserCards();
      setUserCards(response);

      return response;
    } catch (error) {
      handleError(
        error,
        'No se pudieron obtener las tarjetas recibidas',
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCardById = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await getUserCardById(id);
      setUserCard(response);

      return response;
    } catch (error) {
      handleError(
        error,
        'No se pudo obtener la tarjeta',
      );
    } finally {
      setLoading(false);
    }
  };

  const createCard = async (data: CreateUserCard) => {
    try {
      setLoading(true);
      setError(null);

      const response = await createUserCardRequest(data);

      setUserCards((currentCards) => [
        response,
        ...currentCards,
      ]);

      setUserCard(response);

      return response;
    } catch (error) {
      handleError(
        error,
        'No se pudo crear la tarjeta',
      );
    } finally {
      setLoading(false);
    }
  };

  const updateCard = async (
    id: string,
    data: UpdateUserCard,
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await updateUserCardRequest(
        id,
        data,
      );

      setUserCards((currentCards) =>
        currentCards.map((card) =>
          card.id === id ? response : card,
        ),
      );

      setUserCard((currentCard) =>
        currentCard?.id === id
          ? response
          : currentCard,
      );

      return response;
    } catch (error) {
      handleError(
        error,
        'No se pudo actualizar la tarjeta',
      );
    } finally {
      setLoading(false);
    }
  };

  const sendCard = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await sendUserCardRequest(id);

      setUserCards((currentCards) =>
        currentCards.map((card) =>
          card.id === id ? response : card,
        ),
      );

      setUserCard((currentCard) =>
        currentCard?.id === id
          ? response
          : currentCard,
      );

      return response;
    } catch (error) {
      handleError(
        error,
        'No se pudo enviar la tarjeta',
      );
    } finally {
      setLoading(false);
    }
  };

  const markCardAsRead = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response =
        await markUserCardAsReadRequest(id);

      setUserCards((currentCards) =>
        currentCards.map((card) =>
          card.id === id ? response : card,
        ),
      );

      setUserCard((currentCard) =>
        currentCard?.id === id
          ? response
          : currentCard,
      );

      return response;
    } catch (error) {
      handleError(
        error,
        'No se pudo marcar la tarjeta como leída',
      );
    } finally {
      setLoading(false);
    }
  };

  const cancelCard = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await cancelUserCardRequest(id);

      setUserCards((currentCards) =>
        currentCards.map((card) =>
          card.id === id ? response : card,
        ),
      );

      setUserCard((currentCard) =>
        currentCard?.id === id
          ? response
          : currentCard,
      );

      return response;
    } catch (error) {
      handleError(
        error,
        'No se pudo cancelar la tarjeta',
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    userCards,
    userCard,
    loading,
    error,
    clearError,
    fetchSentUserCards,
    fetchReceivedUserCards,
    fetchUserCardById,
    createCard,
    updateCard,
    sendCard,
    markCardAsRead,
    cancelCard,
  };
};
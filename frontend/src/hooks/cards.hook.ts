import { useCallback, useState } from 'react';

import {
  createCard as createCardRequest,
  deleteCard as deleteCardRequest,
  getMyCardById,
  getMyCards,
  getPublicCardById,
  getPublicCards,
  updateCard as updateCardRequest,
} from '../api/cards';

import type {
  Card,
  CreateCard,
  UpdateCard,
} from '../types/cards.schema';

export const useCards = () => {
  const [publicCards, setPublicCards] = useState<Card[]>([]);
  const [myCards, setMyCards] = useState<Card[]>([]);
  const [card, setCard] = useState<Card | null>(null);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Centraliza carga y errores para todas las operaciones.
  const execute = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      fallbackMessage: string,
    ): Promise<T> => {
      setPendingRequests((current) => current + 1);
      setError(null);

      try {
        return await operation();
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : fallbackMessage,
        );

        throw error;
      } finally {
        setPendingRequests((current) => current - 1);
      }
    },
    [],
  );

  const fetchPublicCards = useCallback(
    (): Promise<Card[]> =>
      execute(async () => {
        const response = await getPublicCards();
        setPublicCards(response);
        return response;
      }, 'No se pudieron obtener las tarjetas públicas'),
    [execute],
  );

  const fetchMyCards = useCallback(
    (): Promise<Card[]> =>
      execute(async () => {
        const response = await getMyCards();
        setMyCards(response);
        return response;
      }, 'No se pudieron obtener tus tarjetas'),
    [execute],
  );

  const fetchPublicCardById = useCallback(
    (id: string): Promise<Card> =>
      execute(async () => {
        const response = await getPublicCardById(id);
        setCard(response);
        return response;
      }, 'No se pudo obtener la tarjeta pública'),
    [execute],
  );

  const fetchMyCardById = useCallback(
    (id: string): Promise<Card> =>
      execute(async () => {
        const response = await getMyCardById(id);
        setCard(response);
        return response;
      }, 'No se pudo obtener tu tarjeta'),
    [execute],
  );

  const createCard = useCallback(
    (data: CreateCard): Promise<Card> =>
      execute(async () => {
        const response = await createCardRequest(data);

        setMyCards((currentCards) => [
          response,
          ...currentCards.filter(
            (currentCard) => currentCard.id !== response.id,
          ),
        ]);

        setCard(response);

        return response;
      }, 'No se pudo crear la tarjeta'),
    [execute],
  );

  const updateCard = useCallback(
    (id: string, data: UpdateCard): Promise<Card> =>
      execute(async () => {
        const response = await updateCardRequest(id, data);

        setMyCards((currentCards) =>
          currentCards.map((currentCard) =>
            currentCard.id === id ? response : currentCard,
          ),
        );

        setPublicCards((currentCards) =>
          currentCards
            .map((currentCard) =>
              currentCard.id === id ? response : currentCard,
            )
            .filter(
              (currentCard) =>
                currentCard.isPublic && currentCard.isActive,
            ),
        );

        setCard((currentCard) =>
          currentCard?.id === id ? response : currentCard,
        );

        return response;
      }, 'No se pudo actualizar la tarjeta'),
    [execute],
  );

  const deleteCard = useCallback(
    (id: string): Promise<void> =>
      execute(async () => {
        await deleteCardRequest(id);

        setMyCards((currentCards) =>
          currentCards.filter(
            (currentCard) => currentCard.id !== id,
          ),
        );

        setPublicCards((currentCards) =>
          currentCards.filter(
            (currentCard) => currentCard.id !== id,
          ),
        );

        setCard((currentCard) =>
          currentCard?.id === id ? null : currentCard,
        );
      }, 'No se pudo eliminar la tarjeta'),
    [execute],
  );

  return {
    publicCards,
    myCards,
    card,
    loading: pendingRequests > 0,
    error,
    clearError,
    fetchPublicCards,
    fetchMyCards,
    fetchPublicCardById,
    fetchMyCardById,
    createCard,
    updateCard,
    deleteCard,
  };
};
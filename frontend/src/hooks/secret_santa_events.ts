import { useState } from 'react';

import {
  cancelSecretSantaEvent as cancelEventRequest,
  completeSecretSantaEvent as completeEventRequest,
  createSecretSantaEvent as createEventRequest,
  getMySecretSantaEvents,
  getSecretSantaEventById,
  getSecretSantaEventsByGroup,
  updateSecretSantaEvent as updateEventRequest,
} from '../api/secret_santa_events';

import type {
  CreateSecretSantaEvent,
  SecretSantaEvent,
  UpdateSecretSantaEvent,
} from '../types/secret_santa_events.schema';

export const useSecretSantaEvents = () => {
  const [events, setEvents] = useState<
    SecretSantaEvent[]
  >([]);

  const [event, setEvent] =
    useState<SecretSantaEvent | null>(null);

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

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getMySecretSantaEvents();
      setEvents(response);

      return response;
    } catch (error) {
      handleError(
        error,
        'No se pudieron obtener tus eventos',
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchEventsByGroup = async (groupId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response =
        await getSecretSantaEventsByGroup(groupId);

      setEvents(response);

      return response;
    } catch (error) {
      handleError(
        error,
        'No se pudieron obtener los eventos del grupo',
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchEventById = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response =
        await getSecretSantaEventById(id);

      setEvent(response);

      return response;
    } catch (error) {
      handleError(
        error,
        'No se pudo obtener el evento',
      );
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (
    data: CreateSecretSantaEvent,
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await createEventRequest(data);

      setEvents((currentEvents) => [
        response,
        ...currentEvents,
      ]);

      setEvent(response);

      return response;
    } catch (error) {
      handleError(
        error,
        'No se pudo crear el evento',
      );
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (
    id: string,
    data: UpdateSecretSantaEvent,
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await updateEventRequest(
        id,
        data,
      );

      setEvents((currentEvents) =>
        currentEvents.map((currentEvent) =>
          currentEvent.id === id
            ? response
            : currentEvent,
        ),
      );

      setEvent((currentEvent) =>
        currentEvent?.id === id
          ? response
          : currentEvent,
      );

      return response;
    } catch (error) {
      handleError(
        error,
        'No se pudo actualizar el evento',
      );
    } finally {
      setLoading(false);
    }
  };

  const cancelEvent = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await cancelEventRequest(id);

      setEvents((currentEvents) =>
        currentEvents.map((currentEvent) =>
          currentEvent.id === id
            ? response
            : currentEvent,
        ),
      );

      setEvent((currentEvent) =>
        currentEvent?.id === id
          ? response
          : currentEvent,
      );

      return response;
    } catch (error) {
      handleError(
        error,
        'No se pudo cancelar el evento',
      );
    } finally {
      setLoading(false);
    }
  };

  const completeEvent = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await completeEventRequest(id);

      setEvents((currentEvents) =>
        currentEvents.map((currentEvent) =>
          currentEvent.id === id
            ? response
            : currentEvent,
        ),
      );

      setEvent((currentEvent) =>
        currentEvent?.id === id
          ? response
          : currentEvent,
      );

      return response;
    } catch (error) {
      handleError(
        error,
        'No se pudo completar el evento',
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    events,
    event,
    loading,
    error,
    clearError,
    fetchMyEvents,
    fetchEventsByGroup,
    fetchEventById,
    createEvent,
    updateEvent,
    cancelEvent,
    completeEvent,
  };
};
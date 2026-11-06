import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { userStorage } from '../services/userStorage';
import { DEFAULT_USER, UserProfile } from '../types/user.types';

export interface UserContextType {
  user: UserProfile;
  isUserLoaded: boolean;
  updateName: (name: string) => Promise<void>;
  updateProfileImage: (sourceUri: string) => Promise<void>;
  removeProfileImage: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);
  const [isUserLoaded, setIsUserLoaded] = useState<boolean>(false);

  const userRef = useRef<UserProfile>(DEFAULT_USER);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let isMounted = true;

    console.log('[UserContext] Montando UserProvider. Iniciando carga de usuario...');
    const loadPromise = userStorage
      .getUser()
      .then((stored) => {
        if (isMounted) {
          userRef.current = stored;
          setUser(stored);
          setIsUserLoaded(true);
          console.log('[UserContext] Perfil cargado exitosamente:', stored.name);
        }
      })
      .catch((err) => {
        console.error('[UserContext] Error al cargar perfil:', err);
        if (isMounted) {
          setIsUserLoaded(true);
        }
      });

    writeQueueRef.current = loadPromise;

    return () => {
      isMounted = false;
    };
  }, []);

  const updateName = (name: string): Promise<void> => {
    const trimmed = name.trim();
    if (!trimmed) {
      console.warn('[UserContext] Intento de actualizar nombre con valor vacío.');
      return Promise.resolve();
    }

    console.log('[UserContext] updateName:', trimmed);

    const taskPromise = writeQueueRef.current
      .then(async () => {
        const nextUser: UserProfile = {
          ...userRef.current,
          name: trimmed,
        };

        userRef.current = nextUser;
        setUser(nextUser);

        await userStorage.saveUser(nextUser);
      })
      .catch((error) => {
        console.error('[UserContext] Error al actualizar nombre:', error);
      });

    writeQueueRef.current = taskPromise;
    return taskPromise;
  };


  const updateProfileImage = (sourceUri: string): Promise<void> => {
    if (!sourceUri) {
      console.warn('[UserContext] URI de imagen inválida en updateProfileImage.');
      return Promise.resolve();
    }

    console.log('[UserContext] updateProfileImage solicitado.');

    const taskPromise = writeQueueRef.current
      .then(async () => {
        // Guardar archivo en almacenamiento local persistente
        const persistentUri = await userStorage.saveProfileImageFile(
          sourceUri,
          userRef.current.profileImage
        );

        const nextUser: UserProfile = {
          ...userRef.current,
          profileImage: persistentUri,
        };

        userRef.current = nextUser;
        setUser(nextUser);

        await userStorage.saveUser(nextUser);
      })
      .catch((error) => {
        console.error('[UserContext] Error al actualizar fotografía:', error);
      });

    writeQueueRef.current = taskPromise;
    return taskPromise;
  };

  /**
   * Quita la fotografía actual del perfil y elimina el archivo persistente asociado.
   */
  const removeProfileImage = (): Promise<void> => {
    console.log('[UserContext] removeProfileImage solicitado.');

    const taskPromise = writeQueueRef.current
      .then(async () => {
        const currentImage = userRef.current.profileImage;
        if (currentImage) {
          await userStorage.deleteProfileImageFile(currentImage);
        }

        const nextUser: UserProfile = {
          ...userRef.current,
          profileImage: null,
        };

        userRef.current = nextUser;
        setUser(nextUser);

        await userStorage.saveUser(nextUser);
      })
      .catch((error) => {
        console.error('[UserContext] Error al quitar fotografía:', error);
      });

    writeQueueRef.current = taskPromise;
    return taskPromise;
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isUserLoaded,
        updateName,
        updateProfileImage,
        removeProfileImage,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser debe ser utilizado dentro de un UserProvider');
  }
  return context;
}

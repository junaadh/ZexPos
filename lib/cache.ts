import type { UserType, Restaurant } from "./types"

const CACHE_KEYS = {
  USER: "pos_user",
  RESTAURANTS: "pos_restaurants",
  SELECTED_RESTAURANT: "pos_selected_restaurant",
} as const

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

interface CacheItem<T> {
  data: T
  timestamp: number
}

export class Cache {
  private static isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > CACHE_DURATION
  }

  static set<T>(key: string, data: T): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
    }
    localStorage.setItem(key, JSON.stringify(item))
  }

  static get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key)
      if (!item) return null

      const parsed: CacheItem<T> = JSON.parse(item)
      if (this.isExpired(parsed.timestamp)) {
        localStorage.removeItem(key)
        return null
      }

      return parsed.data
    } catch {
      return null
    }
  }

  static remove(key: string): void {
    localStorage.removeItem(key)
  }

  static clear(): void {
    Object.values(CACHE_KEYS).forEach((key) => {
      localStorage.removeItem(key)
    })
  }

  // Specific cache methods
  static setUser(user: UserType): void {
    this.set(CACHE_KEYS.USER, user)
  }

  static getUser(): UserType | null {
    return this.get<UserType>(CACHE_KEYS.USER)
  }

  static setRestaurants(restaurants: Restaurant[]): void {
    this.set(CACHE_KEYS.RESTAURANTS, restaurants)
  }

  static getRestaurants(): Restaurant[] | null {
    return this.get<Restaurant[]>(CACHE_KEYS.RESTAURANTS)
  }

  static setSelectedRestaurant(restaurant: Restaurant): void {
    this.set(CACHE_KEYS.SELECTED_RESTAURANT, restaurant)
  }

  static getSelectedRestaurant(): Restaurant | null {
    return this.get<Restaurant>(CACHE_KEYS.SELECTED_RESTAURANT)
  }
}

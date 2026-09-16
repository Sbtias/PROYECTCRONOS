import random

from player import Player
from enemy import Enemy


def main():
    print("=== DUNGEON RUNNER ===")
    print("Derrota al enemigo y consigue el tesoro.\n")

    player = Player("Hero", 30, 8)
    enemy = Enemy("Goblin", 24, 6)

    while player.is_alive() and enemy.is_alive():
        print(f"\n{player.name}: {player.hp}/{player.max_hp} HP")
        print(f"{enemy.name}: {enemy.hp}/{enemy.max_hp} HP")
        print("\n1. Atacar")
        print("2. Curarte")
        print("3. Huir")

        choice = input("> ").strip()

        if choice == "1":
            damage = player.attack(enemy)
            print(f"⚔️  Hiciste {damage} de daño.")

            if enemy.is_alive():
                damage = enemy.attack(player)
                print(f"👹 El {enemy.name} te hizo {damage} de daño.")

        elif choice == "2":
            healed = player.heal()
            print(f"❤️  Recuperaste {healed} HP.")

            if enemy.is_alive():
                damage = enemy.attack(player)
                print(f"👹 El {enemy.name} te hizo {damage} de daño.")

        elif choice == "3":
            print("🏃 Escapaste de la mazmorra.")
            return

        else:
            print("Opción no válida.")
            continue

    if player.is_alive():
        reward = random.randint(10, 30)
        print(f"\n🏆 ¡Ganaste! Encontraste {reward} monedas.")
    else:
        print("\n💀 Has perdido. ¡Inténtalo de nuevo!")


if __name__ == "__main__":
    main()

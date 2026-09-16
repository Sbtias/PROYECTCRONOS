class Player:
    def __init__(self, name, max_hp, damage):
        self.name = name
        self.max_hp = max_hp
        self.hp = max_hp
        self.damage = damage
        self.heals_left = 2

    def is_alive(self):
        return self.hp > 0

    def attack(self, enemy):
        import random
        damage = random.randint(max(1, self.damage - 2), self.damage + 2)
        enemy.hp = max(0, enemy.hp - damage)
        return damage

    def heal(self):
        if self.heals_left <= 0:
            print("No te quedan pociones.")
            return 0

        import random
        amount = random.randint(5, 10)
        old_hp = self.hp
        self.hp = min(self.max_hp, self.hp + amount)
        self.heals_left -= 1
        return self.hp - old_hp

class Enemy:
    def __init__(self, name, hp, damage):
        self.name = name
        self.max_hp = hp
        self.hp = hp
        self.damage = damage

    def is_alive(self):
        return self.hp > 0

    def attack(self, player):
        import random
        damage = random.randint(max(1, self.damage - 2), self.damage + 2)
        player.hp = max(0, player.hp - damage)
        return damage

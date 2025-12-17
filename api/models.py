from django.db import models


class Person(models.Model):
    first_name = models.CharField(
        max_length=100,
        verbose_name="Имя"
    )
    last_name = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Фамилия"
    )
    birth_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Дата рождения"
    )
    death_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Дата смерти"
    )

    father = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        related_name='children_from_father',
        on_delete=models.SET_NULL,
        verbose_name="Отец"
    )
    mother = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        related_name='children_from_mother',
        on_delete=models.SET_NULL,
        verbose_name="Мать"
    )

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

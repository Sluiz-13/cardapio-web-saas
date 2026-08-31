export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface-bg px-5 py-10">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-surface-border shadow-sm p-6 sm:p-8">
        <h1 className="font-serif text-2xl text-gray-900 mb-1">Termos de Uso</h1>
        <p className="text-xs text-gray-400 mb-6">
          Última atualização: agosto de 2026
        </p>

        <div className="space-y-5 text-sm text-gray-600 leading-relaxed">
          <p>
            Ao contratar ou utilizar o MenuAir, você concorda com estes Termos
            de Uso. O MenuAir é uma plataforma voltada para restaurantes,
            oferecendo ferramentas para criação de cardápios digitais,
            recebimento de pedidos e gerenciamento do estabelecimento.
          </p>

          <p>
            <strong>1. Sobre o MenuAir.</strong> O MenuAir disponibiliza um
            sistema de cardápio digital, pedidos online, painel administrativo
            e outras ferramentas de gestão, de acordo com os recursos
            disponíveis em cada plano contratado.
          </p>

          <p>
            <strong>2. Cadastro e acesso.</strong> O cliente é responsável
            pelas informações utilizadas no cadastro e pelo acesso à sua
            conta. Os dados de acesso não devem ser compartilhados com pessoas
            que não estejam autorizadas pelo estabelecimento.
          </p>

          <p>
            <strong>3. Conteúdo do restaurante.</strong> O restaurante é
            responsável pelos produtos, preços, imagens, descrições, horários
            de funcionamento e demais informações publicadas em seu cardápio.
            Também é responsabilidade do restaurante possuir autorização para
            utilizar as imagens e outros conteúdos enviados para a plataforma.
          </p>

          <p>
            <strong>4. Pedidos e pagamentos.</strong> O MenuAir fornece as
            ferramentas para que o restaurante receba e gerencie pedidos. A
            preparação, disponibilidade dos produtos, entrega, cobrança e
            atendimento ao consumidor são de responsabilidade do restaurante.
            Quando houver pagamento por Pix ou outro meio integrado, o
            processamento poderá depender do serviço de pagamento utilizado.
          </p>

          <p>
            <strong>5. Planos e pagamento.</strong> O serviço é disponibilizado
            de acordo com o plano contratado. A mensalidade e os recursos
            disponíveis são informados no momento da contratação. O pagamento
            é realizado pelo meio disponibilizado pelo MenuAir.
          </p>

          <p>
            <strong>6. Cancelamento.</strong> Qualquer uma das partes poderá solicitar
             o cancelamento do serviço mediante aviso prévio de 30 (trinta) dias.
             Durante o período de aviso prévio, o serviço permanecerá ativo e as 
             mensalidades continuarão sendo devidas normalmente. Após o término dos
              30 dias, o contrato será encerrado, sem renovação de novas cobranças.
          </p>

          <p>
            <strong>7. Disponibilidade do serviço.</strong> Trabalhamos para
            manter o MenuAir funcionando normalmente, mas não é possível
            garantir disponibilidade ininterrupta. O serviço pode ficar
            temporariamente indisponível em razão de manutenção, problemas de
            infraestrutura, falhas de terceiros ou outros acontecimentos fora
            do nosso controle.
          </p>

          <p>
            <strong>8. Uso indevido.</strong> Não é permitido utilizar o
            MenuAir para atividades ilegais, tentar acessar contas ou dados de
            outros clientes, explorar falhas de segurança ou realizar qualquer
            ação que possa prejudicar o funcionamento da plataforma.
          </p>

          <p>
            <strong>9. Dados e privacidade.</strong> O tratamento de dados
            pessoais realizado pelo MenuAir é explicado em nosso{" "}
            <a
              href="/privacidade"
              className="underline hover:text-brand"
            >
              Aviso de Privacidade
            </a>
            .
          </p>

          <p>
            <strong>10. Alterações destes termos.</strong> Estes Termos podem
            ser atualizados quando necessário para refletir mudanças no
            serviço ou na forma como o MenuAir funciona. A versão mais recente
            estará disponível nesta página.
          </p>

          <p>
            <strong>11. Contato.</strong> Em caso de dúvidas sobre estes Termos
            ou sobre o funcionamento da plataforma, o cliente pode entrar em
            contato com o MenuAir pelos canais de atendimento disponibilizados
            no serviço.
          </p>

          <p>
            <strong>12. Limitação de responsabilidade. </strong>
            O MenuAir não responde por prejuízos causados por informações
             incorretas cadastradas pelo restaurante, indisponibilidade de 
             serviços de terceiros, falhas de conexão com a internet ou qualquer 
             situação fora do nosso controle razoável.
          </p>

          <p> 
            <strong>13. Suspensão e encerramento. </strong>
            Podemos suspender ou encerrar contas que utilizem a 
            plataforma para atividades ilegais, fraudulentas ou 
            que violem estes Termos.  
          </p>

          {/* FOOTER */}
          <footer className="border-t border-slate-200 py-10 px-6">
            <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-sm text-slate-500 gap-6">
              <div className="flex items-center gap-2 font-bold text-lg text-slate-900">
                <div className="bg-slate-900 text-white p-1 rounded-md w-7 h-7 flex items-center justify-center text-xs">
                  M
                </div>
                Menuair
              </div>
            </div>

            <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-slate-100 flex flex-col items-center justify-center text-sm text-slate-500 gap-6">
              <div className="text-center leading-relaxed">
                <p>
                  © {new Date().getFullYear()} Desenvolvido por{" "}
                  <span className="font-medium text-slate-600">
                    Luiz Felippe
                  </span>
                </p>
                <p>Todos os direitos reservados</p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>

    
  );

}